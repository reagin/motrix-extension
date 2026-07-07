import { Download, Languages, Paintbrush, Plug, Shield, Wrench } from 'lucide-react';

import type { IconComponent, SectionId } from './types';

export const optionsSections: Array<{ id: SectionId; icon: IconComponent; key: string }> = [
  { id: 'connection', icon: Plug, key: 'options.connection' },
  { id: 'download', icon: Download, key: 'options.download' },
  { id: 'rules', icon: Shield, key: 'options.rules' },
  { id: 'appearance', icon: Paintbrush, key: 'options.appearance' },
  { id: 'language', icon: Languages, key: 'options.language' },
  { id: 'maintenance', icon: Wrench, key: 'options.maintenance' },
];

export const CHROME_MV3_DOCS_URL = 'https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3';
export const ARIA2_RPC_DOCS_URL = 'https://aria2.github.io/manual/en/html/aria2c.html';
