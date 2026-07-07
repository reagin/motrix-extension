import type * as React from 'react';

export type SectionId = 'connection' | 'download' | 'rules' | 'appearance' | 'language' | 'maintenance';
export type ExtensionPanel = 'allowed' | 'blocked';
export type IconComponent = React.ComponentType<{ className?: string }>;
export type OptionsTranslator = (key: string, values?: Record<string, string | number>) => string;

export interface ConnectionResult {
  ok: boolean;
  message: string;
  latencyMs?: number;
}
