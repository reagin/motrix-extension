import type { DownloadSettings, SiteRule } from '@/src/lib/storage';

export interface DownloadCandidate {
  url: string;
  finalUrl?: string;
  filename?: string;
  fileSize?: number;
  totalBytes?: number;
  mime?: string;
  tabUrl?: string;
  byExtensionId?: string;
}

export interface FilterResult {
  intercept: boolean;
  reason: string;
}

export function shouldInterceptDownload(
  candidate: DownloadCandidate,
  settings: DownloadSettings,
  siteRules: SiteRule[],
  extensionId: string,
): FilterResult {
  if (!settings.enabled) return { intercept: false, reason: 'disabled' };
  if (candidate.byExtensionId === extensionId) return { intercept: false, reason: 'self_download' };

  const url = candidate.finalUrl || candidate.url;
  const protocol = getProtocol(url);
  if (!['http:', 'https:', 'magnet:', 'ed2k:', 'thunder:'].includes(protocol)) {
    return { intercept: false, reason: 'unsupported_protocol' };
  }
  if ((protocol === 'http:' || protocol === 'https:') && !settings.interceptHttp) {
    return { intercept: false, reason: 'http_disabled' };
  }
  if (protocol === 'magnet:' && !settings.interceptMagnet) return { intercept: false, reason: 'magnet_disabled' };
  if (protocol === 'ed2k:' && !settings.interceptEd2k) return { intercept: false, reason: 'ed2k_disabled' };
  if (protocol === 'thunder:' && !settings.interceptThunder) return { intercept: false, reason: 'thunder_disabled' };

  const size = candidate.totalBytes && candidate.totalBytes > 0 ? candidate.totalBytes : candidate.fileSize ?? 0;
  if (settings.minFileSizeBytes > 0 && size > 0 && size < settings.minFileSizeBytes) {
    return { intercept: false, reason: 'small_file' };
  }

  const extension = getExtension(candidate.filename || url);
  if (settings.allowedExtensions.length > 0 && extension && !settings.allowedExtensions.includes(extension)) {
    return { intercept: false, reason: 'extension_not_allowed' };
  }
  if (extension && settings.blockedExtensions.includes(extension)) {
    return { intercept: false, reason: 'extension_blocked' };
  }

  const matchedRule = siteRules.find(
    (rule) => rule.enabled && (globMatch(rule.pattern, url) || globMatch(rule.pattern, candidate.tabUrl || '')),
  );
  if (matchedRule?.action === 'block') return { intercept: false, reason: 'site_rule_blocked' };
  return { intercept: true, reason: matchedRule?.action === 'allow' ? 'site_rule_allowed' : 'matched' };
}

export function isProtocolEnabled(url: string, settings: DownloadSettings): boolean {
  const protocol = getProtocol(url);
  if (protocol === 'magnet:') return settings.enabled && settings.interceptMagnet;
  if (protocol === 'ed2k:') return settings.enabled && settings.interceptEd2k;
  if (protocol === 'thunder:') return settings.enabled && settings.interceptThunder;
  return settings.enabled && settings.interceptHttp;
}

function getProtocol(url: string): string {
  try {
    return new URL(url).protocol;
  } catch {
    return '';
  }
}

function getExtension(value: string): string {
  const clean = value.split('?')[0]?.split('#')[0] ?? value;
  const match = /\.([a-z0-9]{1,12})$/i.exec(clean);
  return match?.[1]?.toLowerCase() ?? '';
}

function globMatch(pattern: string, value: string): boolean {
  if (!pattern || !value) return false;
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replaceAll('*', '.*')
    .replaceAll('?', '.');
  return new RegExp(`^${escaped}$`, 'i').test(value);
}
