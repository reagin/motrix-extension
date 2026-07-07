export interface RedirectContext {
  time: number;
  finalUrl: string;
  originalUrl: string;
}

interface RedirectRequest {
  time: number;
  originalUrl: string;
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

export class RedirectContextStore {
  private byRequestId = new Map<string, RedirectRequest>();
  private byUrl = new Map<string, RedirectContext>();

  constructor(
    private ttlMs = 30000,
    private maxEntries = 512,
  ) {}

  captureRequest(details: { requestId?: string; url: string }): void {
    if (!details.requestId) return;
    this.prune();
    const previous = this.byRequestId.get(details.requestId);
    this.byRequestId.set(details.requestId, {
      originalUrl: previous?.originalUrl ?? details.url,
      time: Date.now(),
    });
    this.evictOverflow();
  }

  captureRedirect(details: { requestId?: string; url: string; redirectUrl?: string }): void {
    if (!details.redirectUrl) return;
    this.prune();

    const request = details.requestId ? this.byRequestId.get(details.requestId) : undefined;
    const originalUrl = request?.originalUrl ?? details.url;
    const time = Date.now();
    const context = {
      finalUrl: details.redirectUrl,
      originalUrl,
      time,
    };

    this.byUrl.set(normalizeUrl(details.url), context);
    this.byUrl.set(normalizeUrl(details.redirectUrl), context);
    if (details.requestId) {
      this.byRequestId.set(details.requestId, {
        originalUrl,
        time,
      });
    }
    this.evictOverflow();
  }

  resolve(urls: string[]): RedirectContext | undefined {
    this.prune();
    for (const url of urls) {
      const context = this.byUrl.get(normalizeUrl(url));
      if (context && context.originalUrl !== url) return { ...context };
    }
    return undefined;
  }

  private prune(): void {
    const expiredAt = Date.now() - this.ttlMs;
    for (const [key, value] of this.byRequestId.entries()) {
      if (value.time < expiredAt) this.byRequestId.delete(key);
    }
    for (const [key, value] of this.byUrl.entries()) {
      if (value.time < expiredAt) this.byUrl.delete(key);
    }
  }

  private evictOverflow(): void {
    while (this.byRequestId.size > this.maxEntries) {
      const oldest = findOldestKey(this.byRequestId);
      if (!oldest) break;
      this.byRequestId.delete(oldest);
    }
    while (this.byUrl.size > this.maxEntries) {
      const oldest = findOldestKey(this.byUrl);
      if (!oldest) break;
      this.byUrl.delete(oldest);
    }
  }
}

function findOldestKey<T extends { time: number }>(items: Map<string, T>): string | undefined {
  let oldestKey: string | undefined;
  let oldestTime = Number.POSITIVE_INFINITY;
  for (const [key, value] of items.entries()) {
    if (value.time < oldestTime) {
      oldestKey = key;
      oldestTime = value.time;
    }
  }
  return oldestKey;
}
