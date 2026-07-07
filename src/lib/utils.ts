import { twMerge } from 'tailwind-merge';
import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(value: number | string | undefined, suffix = 'B'): string {
  const bytes = typeof value === 'string' ? Number(value) : value;
  if (!bytes || Number.isNaN(bytes) || bytes <= 0) return `0 ${suffix}`;
  const units = [suffix, `Ki${suffix}`, `Mi${suffix}`, `Gi${suffix}`, `Ti${suffix}`];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const amount = bytes / 1024 ** exponent;
  return `${amount >= 10 || exponent === 0 ? amount.toFixed(0) : amount.toFixed(1)} ${units[exponent]}`;
}

export function formatSpeed(value: number | string | undefined): string {
  return `${formatBytes(value)}/s`;
}

export function percent(completed: string | number, total: string | number): number {
  const done = Number(completed);
  const all = Number(total);
  if (!all || Number.isNaN(done) || Number.isNaN(all)) return 0;
  return Math.min(100, Math.max(0, (done / all) * 100));
}
