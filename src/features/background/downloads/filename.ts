import { filenameFromUrl, sanitizeFilename } from '@/library/download/filename-metadata';

import type { DownloadItem } from './types';

export function resolveDownloadFilename(item: DownloadItem, metadataFilename?: string): string | undefined {
  const metadata = metadataFilename ? sanitizeFilename(metadataFilename) : undefined;
  if (metadata) return metadata;
  const browserFilename = item.filename?.split(/[\\/]/).filter(Boolean).pop();
  if (browserFilename) return sanitizeFilename(browserFilename);
  return filenameFromUrl(item.finalUrl || item.url);
}
