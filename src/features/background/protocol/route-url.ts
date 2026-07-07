import type { AddDownloadInput } from '@/library/rpc';
import type { RuntimeResponse } from '@/library/messages';

import { loadSnapshot } from '@/library/storage';
import { isProtocolEnabled } from '@/library/download/filter';
import { filenameFromUrl } from '@/library/download/filename-metadata';

import { getCookieHeader } from '../cookies';
import { duplicateGuard } from '../downloads/state';
import { routeDownloadInput } from '../downloads/route-download-input';

export async function routeUrl(url: string, pageUrl: string, source: string): Promise<RuntimeResponse> {
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
