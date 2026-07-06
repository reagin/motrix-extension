export interface RequestHeader {
  name: string;
  value: string;
}

export interface RequestContext {
  url: string;
  time: number;
  referer?: string;
  cookie?: string;
  userAgent?: string;
  requestHeaders: RequestHeader[];
}

const SAFE_HEADER_NAMES = new Set([
  'accept',
  'accept-language',
  'authorization',
  'cookie',
  'referer',
  'user-agent',
]);

export class RequestContextStore {
  private contexts = new Map<string, RequestContext>();

  constructor(private ttlMs = 30000) {}

  capture(details: { url: string; requestHeaders?: Array<{ name: string; value?: string }> }): void {
    const requestHeaders = (details.requestHeaders ?? [])
      .filter((header): header is { name: string; value: string } => Boolean(header.value))
      .filter((header) => SAFE_HEADER_NAMES.has(header.name.toLowerCase()))
      .map((header) => ({ name: header.name, value: header.value }));
    const getHeader = (name: string) =>
      requestHeaders.find((header) => header.name.toLowerCase() === name)?.value;
    this.contexts.set(details.url, {
      url: details.url,
      time: Date.now(),
      referer: getHeader('referer'),
      cookie: getHeader('cookie'),
      userAgent: getHeader('user-agent'),
      requestHeaders,
    });
    this.prune();
  }

  resolve(urls: string[]): RequestContext | undefined {
    this.prune();
    for (const url of urls) {
      const direct = this.contexts.get(url);
      if (direct) return direct;
    }
    const normalized = urls.map((url) => normalizeUrl(url)).filter(Boolean);
    for (const context of this.contexts.values()) {
      if (normalized.includes(normalizeUrl(context.url))) return context;
    }
    return undefined;
  }

  private prune(): void {
    const expiredAt = Date.now() - this.ttlMs;
    for (const [key, value] of this.contexts.entries()) {
      if (value.time < expiredAt) this.contexts.delete(key);
    }
  }
}

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return url;
  }
}
