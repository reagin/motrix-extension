export interface Aria2GlobalStat {
  numActive: string;
  numStopped: string;
  numWaiting: string;
  uploadSpeed: string;
  downloadSpeed: string;
  numStoppedTotal: string;
}

export interface Aria2Version {
  version: string;
  enabledFeatures: string[];
}

export type Aria2TaskStatus
  = | 'active'
    | 'waiting'
    | 'paused'
    | 'error'
    | 'complete'
    | 'removed';

export interface Aria2Task {
  gid: string;
  dir?: string;
  seeder?: string;
  errorCode?: string;
  numSeeders?: string;
  totalLength: string;
  uploadSpeed: string;
  connections?: string;
  downloadSpeed: string;
  errorMessage?: string;
  uploadLength?: string;
  completedLength: string;
  status: Aria2TaskStatus;
  bittorrent?: {
    info?: {
      name?: string;
    };
  };
  files?: Array<{
    index: string;
    path: string;
    length: string;
    completedLength: string;
    selected: string;
    uris?: Array<{ status: string; uri: string }>;
  }>;
}

export interface AddUriOptions {
  'dir'?: string;
  'out'?: string;
  'referer'?: string;
  'header'?: string[];
  'user-agent'?: string;
}

export interface AddDownloadInput {
  url: string;
  dir?: string;
  cookie?: string;
  referer?: string;
  filename?: string;
  finalUrl?: string;
  userAgent?: string;
  requestHeaders?: Array<{ name: string; value: string }>;
}

export interface ConnectionCheck {
  ok: boolean;
  code?: string;
  message: string;
  version?: string;
  latencyMs?: number;
}
