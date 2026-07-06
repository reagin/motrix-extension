import {
  DEFAULT_STORAGE,
  StorageSnapshotSchema,
  type ConnectionConfig,
  type DiagnosticEvent,
  type DownloadSettings,
  type SiteRule,
  type StorageSnapshot,
  type UiPrefs,
} from './schema';

const STORAGE_KEY = 'motrixExtension';
const MAX_DIAGNOSTICS = 200;

export async function loadSnapshot(): Promise<StorageSnapshot> {
  const raw = await browser.storage.local.get(STORAGE_KEY);
  return StorageSnapshotSchema.parse(raw[STORAGE_KEY] ?? DEFAULT_STORAGE);
}

export async function saveSnapshot(snapshot: StorageSnapshot): Promise<void> {
  const parsed = StorageSnapshotSchema.parse(snapshot);
  await browser.storage.local.set({ [STORAGE_KEY]: parsed });
}

export async function updateSnapshot(
  updater: (current: StorageSnapshot) => StorageSnapshot | Promise<StorageSnapshot>,
): Promise<StorageSnapshot> {
  const current = await loadSnapshot();
  const next = await updater(current);
  await saveSnapshot(next);
  return next;
}

export async function updateConnection(patch: Partial<ConnectionConfig>): Promise<StorageSnapshot> {
  return updateSnapshot((current) => ({
    ...current,
    connection: { ...current.connection, ...patch },
  }));
}

export async function updateSettings(patch: Partial<DownloadSettings>): Promise<StorageSnapshot> {
  return updateSnapshot((current) => ({
    ...current,
    settings: { ...current.settings, ...patch },
  }));
}

export async function updateUi(patch: Partial<UiPrefs>): Promise<StorageSnapshot> {
  return updateSnapshot((current) => ({
    ...current,
    ui: { ...current.ui, ...patch },
  }));
}

export async function saveSiteRules(siteRules: SiteRule[]): Promise<StorageSnapshot> {
  return updateSnapshot((current) => ({ ...current, siteRules }));
}

export async function appendDiagnostic(event: Omit<DiagnosticEvent, 'id' | 'timestamp'>): Promise<void> {
  await updateSnapshot((current) => ({
    ...current,
    diagnostics: [
      {
        ...event,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
      },
      ...current.diagnostics,
    ].slice(0, MAX_DIAGNOSTICS),
  }));
}

export async function clearDiagnostics(): Promise<StorageSnapshot> {
  return updateSnapshot((current) => ({ ...current, diagnostics: [] }));
}
