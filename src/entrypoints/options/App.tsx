import { useState } from 'react';

import type { SectionId } from '@/features/options/types';

import { RulesSection } from '@/features/options/sections/rules-section';
import { OptionsLayout } from '@/features/options/components/options-layout';
import { DownloadSection } from '@/features/options/sections/download-section';
import { LanguageSection } from '@/features/options/sections/language-section';
import { useOptionsSettings } from '@/features/options/hooks/use-options-settings';
import { AppearanceSection } from '@/features/options/sections/appearance-section';
import { ConnectionSection } from '@/features/options/sections/connection-section';
import { MaintenanceSection } from '@/features/options/sections/maintenance-section';

export default function App() {
  const [active, setActive] = useState<SectionId>('connection');
  const {
    compact,
    connectionResult,
    exportSettings,
    importSettings,
    persistConnection,
    persistRules,
    persistSettings,
    persistUi,
    refresh,
    restoreDefaults,
    snapshot,
    t,
    testConnection,
    updateConnection,
    updateSettings,
  } = useOptionsSettings();

  return (
    <OptionsLayout active={active} snapshot={snapshot} t={t} onActiveChange={setActive}>
      {active === 'connection'
        ? (
            <ConnectionSection
              compact={compact}
              connectionResult={connectionResult}
              persistConnection={persistConnection}
              snapshot={snapshot}
              t={t}
              testConnection={testConnection}
              updateConnection={updateConnection}
            />
          )
        : null}

      {active === 'download'
        ? (
            <DownloadSection
              compact={compact}
              persistSettings={persistSettings}
              snapshot={snapshot}
              t={t}
              updateSettings={updateSettings}
            />
          )
        : null}

      {active === 'rules'
        ? (
            <RulesSection
              compact={compact}
              persistRules={persistRules}
              persistSettings={persistSettings}
              snapshot={snapshot}
              t={t}
              updateSettings={updateSettings}
            />
          )
        : null}

      {active === 'appearance'
        ? <AppearanceSection compact={compact} persistUi={persistUi} snapshot={snapshot} t={t} />
        : null}

      {active === 'language'
        ? <LanguageSection compact={compact} persistUi={persistUi} snapshot={snapshot} t={t} />
        : null}

      {active === 'maintenance'
        ? (
            <MaintenanceSection
              compact={compact}
              exportSettings={exportSettings}
              importSettings={importSettings}
              refresh={refresh}
              restoreDefaults={restoreDefaults}
              snapshot={snapshot}
              t={t}
            />
          )
        : null}
    </OptionsLayout>
  );
}
