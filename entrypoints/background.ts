import { Aria2RpcClient, RpcAuthError } from '@/src/lib/rpc';
import type { AddDownloadInput } from '@/src/lib/rpc';
import {
  appendDiagnostic,
  clearDiagnostics,
  DEFAULT_STORAGE,
  loadSnapshot,
  saveSnapshot,
  saveSiteRules,
  updateConnection,
  updateSettings,
  updateUi,
  type StorageSnapshot,
} from '@/src/lib/storage';
import type { RuntimeMessage, RuntimeResponse, PopupState, RuntimeState } from '@/src/lib/messages';
import { shouldInterceptDownload, isProtocolEnabled } from '@/src/lib/download/filter';
import { RequestContextStore } from '@/src/lib/download/request-context';
import { FilenameMetadataStore, filenameFromUrl, sanitizeFilename } from '@/src/lib/download/filename-metadata';
import { DuplicateGuard } from '@/src/lib/download/duplicate-guard';
import { openMotrixNewTask, wakeMotrix } from '@/src/lib/protocol/launcher';

interface DownloadItem {
  id: number;
  url: string;
  finalUrl?: string;
  filename?: string;
  fileSize?: number;
  totalBytes?: number;
  mime?: string;
  byExtensionId?: string;
  state?: string;
  referrer?: string;
}

const requestContexts = new RequestContextStore();
const filenameMetadata = new FilenameMetadataStore();
const duplicateGuard = new DuplicateGuard();
const POPUP_RPC_TIMEOUT_MS = 1200;

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(() => {
    void ensureContextMenu();
  });

  browser.runtime.onStartup.addListener(() => {
    void ensureContextMenu();
  });

  browser.contextMenus.onClicked.addListener((info, tab) => {
    const url = info.linkUrl || info.srcUrl || info.pageUrl || info.selectionText;
    if (!url) return;
    void routeUrl(url, tab?.url || info.pageUrl || '', 'context_menu');
  });

  browser.downloads.onCreated.addListener((item) => {
    void handleDownloadCreated(item as DownloadItem);
  });

  browser.webRequest.onBeforeSendHeaders.addListener(
    (details) => {
      requestContexts.capture({
        url: details.url,
        requestHeaders: details.requestHeaders?.map((header) => ({
          name: header.name,
          value: header.value,
        })),
      });
      return undefined;
    },
    { urls: ['<all_urls>'] },
    ['requestHeaders', 'extraHeaders'],
  );

  browser.webRequest.onHeadersReceived.addListener(
    (details) => {
      filenameMetadata.capture({
        url: details.url,
        responseHeaders: details.responseHeaders?.map((header) => ({
          name: header.name,
          value: header.value,
        })),
      });
      return undefined;
    },
    { urls: ['<all_urls>'] },
    ['responseHeaders', 'extraHeaders'],
  );

  browser.runtime.onMessage.addListener((message: RuntimeMessage) => handleMessage(message));
});

async function ensureContextMenu(): Promise<void> {
  await browser.contextMenus.removeAll();
  await browser.contextMenus.create({
    id: 'download-with-motrix',
    title: 'Download with Motrix',
    contexts: ['link', 'image', 'audio', 'video', 'page', 'selection'],
  });
}

async function handleDownloadCreated(item: DownloadItem): Promise<void> {
  const snapshot = await loadSnapshot();
  if (item.state && item.state !== 'in_progress') return;

  const finalUrl = item.finalUrl || item.url;
  const context = requestContexts.resolve([finalUrl, item.url]);
  const metadata = filenameMetadata.resolve([finalUrl, item.url]);
  const filename = resolveDownloadFilename(item, metadata?.filename);
  const filter = shouldInterceptDownload(
    {
      url: item.url,
      finalUrl,
      filename,
      fileSize: item.fileSize,
      totalBytes: item.totalBytes,
      mime: item.mime,
      tabUrl: context?.referer || item.referrer,
      byExtensionId: item.byExtensionId,
    },
    snapshot.settings,
    snapshot.siteRules,
    browser.runtime.id,
  );

  if (!filter.intercept) {
    await appendDiagnostic({
      level: 'info',
      code: 'download_skipped',
      message: `Skipped download: ${filter.reason}`,
      context: { url: finalUrl, reason: filter.reason },
    });
    return;
  }

  if (!duplicateGuard.reserve([finalUrl, filename, item.totalBytes])) {
    await browser.downloads.cancel(item.id).catch(() => undefined);
    await appendDiagnostic({
      level: 'info',
      code: 'download_duplicate_blocked',
      message: `Duplicate download blocked: ${finalUrl}`,
      context: { url: finalUrl, filename },
    });
    return;
  }

  await browser.downloads.cancel(item.id).catch(() => undefined);
  if (snapshot.settings.hideChromeDownload) {
    await browser.downloads.erase({ id: item.id }).catch(() => undefined);
  }

  await appendDiagnostic({
    level: 'info',
    code: 'download_intercepted',
    message: `Intercepted download: ${filename}`,
    context: { url: finalUrl, filename, reason: filter.reason },
  });

  const cookie = snapshot.settings.forwardCookies
    ? context?.cookie || (await getCookieHeader(finalUrl))
    : undefined;
  const input: AddDownloadInput = {
    url: item.url,
    finalUrl,
    filename,
    referer: context?.referer || item.referrer,
    cookie,
    userAgent: context?.userAgent,
    requestHeaders: snapshot.settings.forwardHeaders ? context?.requestHeaders : undefined,
    dir: snapshot.settings.defaultDir || undefined,
  };
  await routeDownloadInput(input, snapshot, 'download_capture');
}

async function routeUrl(url: string, pageUrl: string, source: string): Promise<RuntimeResponse> {
  const snapshot = await loadSnapshot();
  if (!isProtocolEnabled(url, snapshot.settings)) {
    return { ok: false, code: 'disabled', message: 'This protocol is disabled' };
  }
  if (!duplicateGuard.reserve([url, pageUrl])) {
    return { ok: true, result: 'duplicate-blocked' };
  }
  const cookie = snapshot.settings.forwardCookies ? await getCookieHeader(url) : undefined;
  const input: AddDownloadInput = {
    url,
    referer: pageUrl,
    cookie,
    filename: filenameFromUrl(url),
    dir: snapshot.settings.defaultDir || undefined,
  };
  await routeDownloadInput(input, snapshot, source);
  return { ok: true, result: 'routed' };
}

async function routeDownloadInput(
  input: AddDownloadInput,
  snapshot: StorageSnapshot,
  source: string,
): Promise<void> {
  const client = new Aria2RpcClient(snapshot.connection);
  try {
    const result = await client.addDownload(input);
    await appendDiagnostic({
      level: 'info',
      code: 'download_routed',
      message: `Routed to Motrix: ${input.finalUrl || input.url}`,
      context: { source, gid: result.gid, url: input.finalUrl || input.url, filename: input.filename },
    });
    return;
  } catch (error) {
    await appendDiagnostic({
      level: error instanceof RpcAuthError ? 'error' : 'warn',
      code: error instanceof RpcAuthError ? 'rpc_auth_failed' : 'rpc_route_failed',
      message: error instanceof Error ? error.message : String(error),
      context: { source, url: input.finalUrl || input.url },
    });
    if (error instanceof RpcAuthError || !snapshot.settings.autoLaunchApp) throw error;
  }

  await wakeMotrix().catch(() => undefined);
  await delay(1200);

  try {
    const retryClient = new Aria2RpcClient(snapshot.connection);
    const result = await retryClient.addDownload(input);
    await appendDiagnostic({
      level: 'info',
      code: 'download_routed_after_wake',
      message: `Routed to Motrix after wake: ${input.finalUrl || input.url}`,
      context: { source, gid: result.gid },
    });
    return;
  } catch (error) {
    await appendDiagnostic({
      level: 'warn',
      code: 'protocol_fallback',
      message: `Falling back to motrix:// for ${input.finalUrl || input.url}`,
      context: { source, error: error instanceof Error ? error.message : String(error) },
    });
    await openMotrixNewTask(input.finalUrl || input.url);
  }
}

async function handleMessage(message: RuntimeMessage): Promise<RuntimeResponse> {
  try {
    switch (message.type) {
      case 'popup-state':
        return { ok: true, state: await buildPopupState() };
      case 'runtime-state':
        return { ok: true, runtime: await buildRuntimeState(await loadSnapshot()) };
      case 'settings-snapshot':
        return { ok: true, snapshot: await loadSnapshot() };
      case 'test-connection': {
        const snapshot = await loadSnapshot();
        const client = new Aria2RpcClient(message.connection ?? snapshot.connection);
        return { ok: true, result: await client.checkConnection() };
      }
      case 'update-settings':
        return { ok: true, snapshot: await updateSettings(message.patch) };
      case 'update-connection':
        return { ok: true, snapshot: await updateConnection(message.patch) };
      case 'update-ui':
        return { ok: true, snapshot: await updateUi(message.patch) };
      case 'save-site-rules':
        return { ok: true, snapshot: await saveSiteRules(message.siteRules) };
      case 'add-url':
        return await routeUrl(message.url, '', 'manual_popup');
      case 'task-action':
        await performTaskAction(message.action, message.gid);
        return { ok: true };
      case 'pause-all':
        await withClient((client) => client.pauseAll());
        return { ok: true };
      case 'resume-all':
        await withClient((client) => client.resumeAll());
        return { ok: true };
      case 'wake-motrix':
        await wakeMotrix();
        return { ok: true };
      case 'content-protocol-click':
        return await routeUrl(message.url, message.pageUrl, 'content_protocol');
      case 'clear-diagnostics':
        return { ok: true, snapshot: await clearDiagnostics() };
      case 'restore-defaults':
        await saveSnapshot(DEFAULT_STORAGE);
        return { ok: true, snapshot: DEFAULT_STORAGE };
      case 'replace-snapshot':
        await saveSnapshot(message.snapshot);
        return { ok: true, snapshot: message.snapshot };
      default:
        return { ok: false, code: 'unknown_message', message: 'Unknown message' };
    }
  } catch (error) {
    return {
      ok: false,
      code: error instanceof Error ? error.name : 'error',
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

async function buildPopupState(): Promise<PopupState> {
  const snapshot = await loadSnapshot();
  return {
    snapshot,
    runtime: await buildRuntimeState(snapshot),
  };
}

async function buildRuntimeState(snapshot: StorageSnapshot): Promise<RuntimeState> {
  const client = new Aria2RpcClient({
    ...snapshot.connection,
    timeoutMs: Math.min(snapshot.connection.timeoutMs, POPUP_RPC_TIMEOUT_MS),
  });
  const connection = await client.checkConnection();
  const base = {
    connection: { ...connection, checkedAt: Date.now() },
    tasks: { active: [], waiting: [], stopped: [] },
  };
  if (!connection.ok) return base;
  const [stat, active, waiting, stopped] = await Promise.all([
    client.getGlobalStat(),
    client.tellActive(),
    client.tellWaiting(0, 20),
    client.tellStopped(0, 20),
  ]);
  return {
    ...base,
    stat,
    tasks: { active, waiting, stopped },
  };
}

async function performTaskAction(action: 'pause' | 'resume' | 'remove', gid: string): Promise<void> {
  await withClient((client) => {
    if (action === 'pause') return client.pause(gid);
    if (action === 'resume') return client.resume(gid);
    return client.remove(gid);
  });
}

async function withClient<T>(operation: (client: Aria2RpcClient) => Promise<T>): Promise<T> {
  const snapshot = await loadSnapshot();
  return operation(new Aria2RpcClient(snapshot.connection));
}

async function getCookieHeader(url: string): Promise<string | undefined> {
  try {
    const cookies = await browser.cookies.getAll({ url });
    if (!cookies.length) return undefined;
    return cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; ');
  } catch {
    return undefined;
  }
}

function resolveDownloadFilename(item: DownloadItem, metadataFilename?: string): string | undefined {
  const metadata = metadataFilename ? sanitizeFilename(metadataFilename) : undefined;
  if (metadata) return metadata;
  const browserFilename = item.filename?.split(/[\\/]/).filter(Boolean).pop();
  if (browserFilename) return sanitizeFilename(browserFilename);
  return filenameFromUrl(item.finalUrl || item.url);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms);
  });
}
