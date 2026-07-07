import { useEffect } from 'react';

import type { UiPrefs } from '@/library/storage';

export function useTheme(ui: UiPrefs | undefined) {
  useEffect(() => {
    if (!ui) return;
    const root = document.documentElement;
    const systemDark = matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = ui.theme === 'dark' || (ui.theme === 'system' && systemDark);
    root.classList.toggle('dark', dark);
    root.dataset.density = ui.density;
  }, [ui]);
}
