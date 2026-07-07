import { useCallback } from 'react';

import { type Locale, translate } from '@/library/i18n/dictionaries';

export function useI18n(locale: Locale) {
  const t = useCallback(
    (key: string, values?: Record<string, string | number>) => translate(locale, key, values),
    [locale],
  );
  return { locale, t };
}
