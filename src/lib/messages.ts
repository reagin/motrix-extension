import type { ConnectionConfig, DiagnosticEvent, DownloadSettings, SiteRule, StorageSnapshot, UiPrefs } from '@/src/lib/storage';
import type { Aria2GlobalStat, Aria2Task } from '@/src/lib/rpc';

export interface PopupState {
  snapshot: StorageSnapshot;
  connection: {
    ok: boolean;
    code?: string;
    message: string;
    version?: string;
    latencyMs?: number;
    checkedAt: number;
  };
  stat?: Aria2GlobalStat;
  tasks: {
    active: Aria2Task[];
    waiting: Aria2Task[];
    stopped: Aria2Task[];
  };
}

export type RuntimeMessage =
  | { type: 'popup-state' }
  | { type: 'test-connection'; connection?: ConnectionConfig }
  | { type: 'update-settings'; patch: Partial<DownloadSettings> }
  | { type: 'update-connection'; patch: Partial<ConnectionConfig> }
  | { type: 'update-ui'; patch: Partial<UiPrefs> }
  | { type: 'save-site-rules'; siteRules: SiteRule[] }
  | { type: 'add-url'; url: string }
  | { type: 'task-action'; action: 'pause' | 'resume' | 'remove'; gid: string }
  | { type: 'pause-all' }
  | { type: 'resume-all' }
  | { type: 'wake-motrix' }
  | { type: 'content-protocol-click'; url: string; pageUrl: string }
  | { type: 'clear-diagnostics' }
  | { type: 'restore-defaults' }
  | { type: 'replace-snapshot'; snapshot: StorageSnapshot };

export type RuntimeResponse =
  | { ok: true; state?: PopupState; snapshot?: StorageSnapshot; diagnostics?: DiagnosticEvent[]; result?: unknown }
  | { ok: false; code: string; message: string };
