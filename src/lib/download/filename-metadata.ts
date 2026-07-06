export interface FilenameMetadata {
  url: string;
  filename: string;
  time: number;
}

export class FilenameMetadataStore {
  private metadata = new Map<string, FilenameMetadata>();

  constructor(private ttlMs = 30000) {}

  capture(details: { url: string; responseHeaders?: Array<{ name: string; value?: string }> }): void {
    const disposition = details.responseHeaders?.find(
      (header) => header.name.toLowerCase() === 'content-disposition',
    )?.value;
    const filename = disposition ? parseContentDispositionFilename(disposition) : undefined;
    if (!filename) return;
    this.metadata.set(details.url, { url: details.url, filename, time: Date.now() });
    this.prune();
  }

  resolve(urls: string[]): FilenameMetadata | undefined {
    this.prune();
    for (const url of urls) {
      const direct = this.metadata.get(url);
      if (direct) return direct;
    }
    return undefined;
  }

  private prune(): void {
    const expiredAt = Date.now() - this.ttlMs;
    for (const [key, value] of this.metadata.entries()) {
      if (value.time < expiredAt) this.metadata.delete(key);
    }
  }
}

export function parseContentDispositionFilename(value: string): string | undefined {
  const encoded = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(value)?.[1];
  if (encoded) return sanitizeFilename(decodeURIComponent(encoded.replaceAll('"', '').trim()));
  const plain = /filename\s*=\s*"?([^";]+)"?/i.exec(value)?.[1];
  return plain ? sanitizeFilename(plain.trim()) : undefined;
}

export function sanitizeFilename(value: string): string {
  return value.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, ' ').trim();
}

export function filenameFromUrl(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    const raw = parsed.pathname.split('/').filter(Boolean).pop();
    return raw ? sanitizeFilename(decodeURIComponent(raw)) : undefined;
  } catch {
    return undefined;
  }
}
