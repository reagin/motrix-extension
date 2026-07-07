import type { AddDownloadInput } from '@/library/rpc';

import { appendDiagnostic, loadSnapshot } from '@/library/storage';
import { shouldInterceptDownload } from '@/library/download/filter';

import type { DownloadItem } from './types';

import { getCookieHeader } from '../cookies';
import { resolveDownloadFilename } from './filename';
import { routeDownloadInput } from './route-download-input';
import { duplicateGuard, filenameMetadata, redirectContexts, requestContexts } from './state';

export async function handleDownloadCreated(item: DownloadItem): Promise<void> {
  const snapshot = await loadSnapshot();
  if (item.state && item.state !== 'in_progress') return;

  const finalUrl = item.finalUrl || item.url;
  const redirect = redirectContexts.resolve([finalUrl, item.url]);
  const taskUrl = redirect?.originalUrl || item.url;
  const context = requestContexts.resolve([taskUrl, finalUrl, item.url]);
  const metadata = filenameMetadata.resolve([finalUrl, item.url, taskUrl]);
  const filename = resolveDownloadFilename(item, metadata?.filename);
  const filter = shouldInterceptDownload(
    {
      url: taskUrl,
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
      context: { url: taskUrl, finalUrl, reason: filter.reason },
    });
    return;
  }

  if (!duplicateGuard.reserve([taskUrl, finalUrl, filename, item.totalBytes])) {
    await browser.downloads.cancel(item.id).catch(() => undefined);
    await appendDiagnostic({
      level: 'info',
      code: 'download_duplicate_blocked',
      message: `Duplicate download blocked: ${taskUrl}`,
      context: { url: taskUrl, finalUrl, filename },
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
    context: { url: taskUrl, finalUrl, filename, reason: filter.reason },
  });

  const cookie = snapshot.settings.forwardCookies
    ? context?.cookie || (await getCookieHeader(taskUrl))
    : undefined;
  const input: AddDownloadInput = {
    url: taskUrl,
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
