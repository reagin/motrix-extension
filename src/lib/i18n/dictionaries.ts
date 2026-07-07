import { enUS } from './locales/en-US';
import { zhCN } from './locales/zh-CN';

export const dictionaries = {
  'en-US': enUS,
  'zh-CN': zhCN,
} as const;

export type Locale = keyof typeof dictionaries;
export type Dictionary = (typeof dictionaries)['en-US'];

export const localeLabels: Record<Locale, string> = {
  'en-US': 'English',
  'zh-CN': '简体中文',
};

export interface LocaleDisplayEntry {
  id: Locale;
  endonym: string;
  exonym: string;
  description: string;
}

const rawLocaleDisplayEntries = [
  {
    id: 'zh-CN',
    endonym: '简体中文',
    exonym: '简体中文',
    description: '使用中文界面文本',
  },
  {
    id: 'en-US',
    endonym: 'English',
    exonym: 'English',
    description: 'Use English interface text',
  },
] satisfies LocaleDisplayEntry[];

export const localeDisplayEntries: LocaleDisplayEntry[] = [...rawLocaleDisplayEntries].sort((a, b) =>
  a.exonym.localeCompare(b.exonym),
);

export function translate(locale: Locale, key: string, values?: Record<string, string | number>): string {
  const parts = key.split('.');
  let cursor: unknown = dictionaries[locale];
  for (const part of parts) {
    cursor = typeof cursor === 'object' && cursor !== null ? (cursor as Record<string, unknown>)[part] : undefined;
  }
  const fallback = parts.reduce<unknown>(
    (value, part) => (typeof value === 'object' && value !== null ? (value as Record<string, unknown>)[part] : undefined),
    dictionaries['en-US'],
  );
  let message = typeof cursor === 'string' ? cursor : typeof fallback === 'string' ? fallback : key;
  if (values) {
    for (const [name, value] of Object.entries(values)) {
      message = message.replaceAll(`{${name}}`, String(value));
    }
  }
  return message;
}
