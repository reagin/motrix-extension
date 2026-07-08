import type { Aria2GlobalStat, Aria2Task, Aria2TaskStatus } from '@/library/rpc';
import type { ConnectionConfig, DiagnosticEvent, DownloadSettings, SiteRule, StorageSnapshot, UiPrefs } from '@/library/storage';

export interface PopupState {
  runtime: RuntimeState;
  snapshot: StorageSnapshot;
}

export interface RuntimeState {
  stat?: Aria2GlobalStat;
  tasks: {
    active: Aria2Task[];
    waiting: Aria2Task[];
    stopped: Aria2Task[];
  };
  connection: {
    ok: boolean;
    code?: string;
    message: string;
    version?: string;
    latencyMs?: number;
    checkedAt: number;
  };
}

export type RuntimeTaskLane = keyof RuntimeState['tasks'];

export type RuntimeMessage
  = | { type: 'popup-state' }
    | { type: 'runtime-state' }
    | { type: 'settings-snapshot' }
    | { type: 'test-connection'; connection?: ConnectionConfig }
    | { type: 'update-settings'; patch: Partial<DownloadSettings> }
    | { type: 'update-connection'; patch: Partial<ConnectionConfig> }
    | { type: 'update-ui'; patch: Partial<UiPrefs> }
    | { type: 'save-site-rules'; siteRules: SiteRule[] }
    | { type: 'add-url'; url: string }
    | { type: 'task-action'; action: 'pause' | 'resume' | 'remove'; gid: string; status?: Aria2TaskStatus }
    | { type: 'pause-all'; gids?: string[] }
    | { type: 'resume-all' }
    | { type: 'clear-tasks'; lane: RuntimeTaskLane; gids: string[] }
    | { type: 'wake-motrix' }
    | { type: 'content-protocol-click'; url: string; pageUrl: string }
    | { type: 'append-diagnostic'; event: Omit<DiagnosticEvent, 'id' | 'timestamp'> }
    | { type: 'clear-diagnostics' }
    | { type: 'restore-defaults' }
    | { type: 'replace-snapshot'; snapshot: StorageSnapshot };

export type RuntimeResponse
  = | {
    ok: true;
    state?: PopupState;
    runtime?: RuntimeState;
    snapshot?: StorageSnapshot;
    diagnostics?: DiagnosticEvent[];
    result?: unknown;
  }
  | { ok: false; code: string; message: string };
