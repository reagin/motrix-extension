export class DuplicateGuard {
  private recent = new Map<string, number>();

  constructor(private ttlMs = 5000) {}

  reserve(parts: Array<string | number | undefined>): boolean {
    this.prune();
    const key = parts.filter(Boolean).join('|');
    if (!key) return true;
    if (this.recent.has(key)) return false;
    this.recent.set(key, Date.now());
    return true;
  }

  private prune(): void {
    const expired = Date.now() - this.ttlMs;
    for (const [key, time] of this.recent.entries()) {
      if (time < expired) this.recent.delete(key);
    }
  }
}
