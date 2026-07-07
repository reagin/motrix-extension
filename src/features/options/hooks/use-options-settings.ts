import { toast } from 'sonner';
import { useCallback, useEffect, useState } from 'react';

import { useI18n } from '@/hooks/use-i18n';
import { useTheme } from '@/hooks/use-theme';
import { sendRuntimeMessage } from '@/library/runtime';
import { DEFAULT_STORAGE, type StorageSnapshot, StorageSnapshotSchema } from '@/library/storage';

import type { ConnectionResult, OptionsTranslator } from '../types';

export function useOptionsSettings() {
  const [snapshot, setSnapshot] = useState<StorageSnapshot>(DEFAULT_STORAGE);
  const [connectionResult, setConnectionResult] = useState<ConnectionResult | null>(null);
  const { t } = useI18n(snapshot.ui.locale);
  useTheme(snapshot.ui);

  const refresh = useCallback(async () => {
    const response = await sendRuntimeMessage({ type: 'settings-snapshot' });
    if (response.ok && response.snapshot) setSnapshot(response.snapshot);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const updateConnection = useCallback((patch: Partial<StorageSnapshot['connection']>) => {
    setSnapshot((current) => ({ ...current, connection: { ...current.connection, ...patch } }));
  }, []);

  const updateSettings = useCallback((patch: Partial<StorageSnapshot['settings']>) => {
    setSnapshot((current) => ({ ...current, settings: { ...current.settings, ...patch } }));
  }, []);

  const persistConnection = useCallback(async () => {
    const response = await sendRuntimeMessage({ type: 'update-connection', patch: snapshot.connection });
    if (response.ok && response.snapshot) setSnapshot(response.snapshot);
    toast.success(t('common.saved'));
  }, [snapshot.connection, t]);

  const persistSettings = useCallback(async () => {
    const response = await sendRuntimeMessage({ type: 'update-settings', patch: snapshot.settings });
    if (response.ok && response.snapshot) setSnapshot(response.snapshot);
    toast.success(t('common.saved'));
  }, [snapshot.settings, t]);

  const persistUi = useCallback(async (patch = snapshot.ui) => {
    const response = await sendRuntimeMessage({ type: 'update-ui', patch });
    if (response.ok && response.snapshot) setSnapshot(response.snapshot);
  }, [snapshot.ui]);

  const persistRules = useCallback(async (siteRules = snapshot.siteRules) => {
    const response = await sendRuntimeMessage({ type: 'save-site-rules', siteRules });
    if (response.ok && response.snapshot) setSnapshot(response.snapshot);
  }, [snapshot.siteRules]);

  const testConnection = useCallback(async () => {
    setConnectionResult({ ok: false, message: t('common.checking') });
    const response = await sendRuntimeMessage({ type: 'test-connection', connection: snapshot.connection });
    if (response.ok && response.result && typeof response.result === 'object') {
      setConnectionResult(response.result as ConnectionResult);
    } else {
      setConnectionResult({ ok: false, message: response.ok ? t('status.invalid') : response.message });
    }
  }, [snapshot.connection, t]);

  const exportSettings = useCallback(() => {
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'motrix-extension-settings.json';
    link.click();
    URL.revokeObjectURL(url);
  }, [snapshot]);

  const importSettings = useCallback(async (file: File | undefined) => {
    if (!file) return;
    try {
      const parsed = StorageSnapshotSchema.parse(JSON.parse(await file.text()));
      const response = await sendRuntimeMessage({ type: 'replace-snapshot', snapshot: parsed });
      if (response.ok && response.snapshot) setSnapshot(response.snapshot);
      toast.success(t('common.saved'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    }
  }, [t]);

  const restoreDefaults = useCallback(async () => {
    const response = await sendRuntimeMessage({ type: 'restore-defaults' });
    if (response.ok && response.snapshot) setSnapshot(response.snapshot);
    toast.success(t('common.saved'));
  }, [t]);

  return {
    t: t as OptionsTranslator,
    compact: snapshot.ui.density === 'compact',
    snapshot,
    refresh,
    updateConnection,
    updateSettings,
    persistConnection,
    persistSettings,
    persistUi,
    persistRules,
    testConnection,
    connectionResult,
    exportSettings,
    importSettings,
    restoreDefaults,
  };
}
