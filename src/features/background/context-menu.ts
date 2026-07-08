import type { StorageSnapshot } from '@/library/storage';
import type { ContextMenuTarget, ContextMenuTargetSource, RuntimeMessage, RuntimeResponse } from '@/library/messages';

import { loadSnapshot } from '@/library/storage';

import { routeUrl } from './protocol/route-url';

const CONTEXT_MENU_ID = 'download-with-motrix';
const CONTEXT_MENU_CONTEXTS: [Browser.contextMenus.ContextType, ...Browser.contextMenus.ContextType[]] = [
  contextType('link'),
  contextType('image'),
  contextType('audio'),
  contextType('video'),
  contextType('page'),
  contextType('selection'),
];
const SUPPORTED_PROTOCOLS = new Set(['http:', 'https:', 'magnet:', 'ed2k:', 'thunder:']);
const TEXT_URL_PATTERN = /(https?:\/\/[^\s<>"'`]+|magnet:\?[^\s<>"'`]+|ed2k:\/\/[^\s<>"'`]+|thunder:\/\/[A-Z0-9+/=]+)/i;

export async function syncContextMenuVisibility(snapshot?: StorageSnapshot): Promise<void> {
  const visible = snapshot?.ui.showContextMenu ?? (await loadSnapshot()).ui.showContextMenu;
  if (!visible) {
    await browser.contextMenus.remove(CONTEXT_MENU_ID).catch(() => undefined);
    return;
  }

  const properties = {
    title: 'Download with Motrix',
    contexts: CONTEXT_MENU_CONTEXTS,
  };

  try {
    await browser.contextMenus.update(CONTEXT_MENU_ID, properties);
  } catch {
    try {
      browser.contextMenus.create({
        id: CONTEXT_MENU_ID,
        ...properties,
      });
    } catch {
      // Ignore duplicate creation races from startup/install events.
    }
  }
}

function contextType(value: string): Browser.contextMenus.ContextType {
  return value as Browser.contextMenus.ContextType;
}

export function handleContextMenuClick(info: Browser.contextMenus.OnClickData, tab?: Browser.tabs.Tab): void {
  if (info.menuItemId !== CONTEXT_MENU_ID) return;
  void routeContextMenuClick(info, tab);
}

async function routeContextMenuClick(info: Browser.contextMenus.OnClickData, tab?: Browser.tabs.Tab): Promise<void> {
  const target = await resolveContextMenuTarget(info, tab);
  if (!target.url) return;
  await routeUrl(target.url, target.pageUrl, `context_menu_${target.source}`);
}

async function resolveContextMenuTarget(
  info: Browser.contextMenus.OnClickData,
  tab?: Browser.tabs.Tab,
): Promise<ContextMenuTarget> {
  const nativeTarget = getNativeContextMenuTarget(info);
  if (nativeTarget) return nativeTarget;

  const contentTarget = await resolveContentContextMenuTarget(info, tab);
  if (contentTarget?.url && isSupportedUrl(contentTarget.url)) return contentTarget;

  const selectionUrl = findSupportedTextUrl(info.selectionText);
  if (selectionUrl) return buildTarget(selectionUrl, getContextPageUrl(info), 'selection');

  const pageUrl = normalizeSupportedUrl(info.pageUrl) || normalizeSupportedUrl(info.frameUrl);
  return {
    url: pageUrl,
    pageUrl: info.pageUrl || info.frameUrl || '',
    source: 'page',
  };
}

function getNativeContextMenuTarget(info: Browser.contextMenus.OnClickData): ContextMenuTarget | undefined {
  const pageUrl = getContextPageUrl(info);
  const linkUrl = normalizeSupportedUrl(info.linkUrl);
  if (linkUrl) return buildTarget(linkUrl, pageUrl, 'link');

  const srcUrl = normalizeSupportedUrl(info.srcUrl);
  if (srcUrl) return buildTarget(srcUrl, pageUrl, 'media');

  return undefined;
}

function getContextPageUrl(info: Browser.contextMenus.OnClickData): string {
  return info.frameUrl || info.pageUrl || '';
}

async function resolveContentContextMenuTarget(
  info: Browser.contextMenus.OnClickData,
  tab?: Browser.tabs.Tab,
): Promise<ContextMenuTarget | undefined> {
  if (typeof tab?.id !== 'number') return undefined;

  const message = { type: 'resolve-context-menu-target' } satisfies RuntimeMessage;
  const frameId = typeof info.frameId === 'number' ? info.frameId : undefined;
  try {
    const response = frameId === undefined
      ? await browser.tabs.sendMessage(tab.id, message)
      : await browser.tabs.sendMessage(tab.id, message, { frameId });
    return getContextMenuTargetFromResponse(response);
  } catch {
    return undefined;
  }
}

function getContextMenuTargetFromResponse(response: unknown): ContextMenuTarget | undefined {
  if (!isRuntimeResponse(response) || !response.ok) return undefined;
  return response.contextMenuTarget;
}

function isRuntimeResponse(value: unknown): value is RuntimeResponse {
  return typeof value === 'object' && value !== null && 'ok' in value;
}

function buildTarget(url: string, pageUrl: string, source: ContextMenuTargetSource): ContextMenuTarget {
  return { url, pageUrl, source };
}

function findSupportedTextUrl(text: string | undefined): string | undefined {
  const match = text?.match(TEXT_URL_PATTERN)?.[0];
  return normalizeSupportedUrl(match);
}

function normalizeSupportedUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim().replace(/^[<('"“‘]+/, '').replace(/[>)'",.，。；;!！?？]+$/, '');
  return isSupportedUrl(trimmed) ? trimmed : undefined;
}

function isSupportedUrl(value: string): boolean {
  return SUPPORTED_PROTOCOLS.has(getProtocol(value));
}

function getProtocol(value: string): string {
  try {
    return new URL(value).protocol;
  } catch {
    return /^([a-z][a-z0-9+.-]*):/i.exec(value)?.[1]?.toLowerCase().concat(':') ?? '';
  }
}
