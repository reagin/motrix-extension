import { useCallback } from 'react';
import { translate, type Locale } from '@/src/lib/i18n/dictionaries';

export function useI18n(locale: Locale) {
  const t = useCallback(
    (key: string, values?: Record<string, string | number>) => translate(locale, key, values),
    [locale],
  );
  return { locale, t };
}
