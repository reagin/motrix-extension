export interface Aria2GlobalStat {
  downloadSpeed: string;
  uploadSpeed: string;
  numActive: string;
  numWaiting: string;
  numStopped: string;
  numStoppedTotal: string;
}

export interface Aria2Version {
  version: string;
  enabledFeatures: string[];
}

export type Aria2TaskStatus =
  | 'active'
  | 'waiting'
  | 'paused'
  | 'error'
  | 'complete'
  | 'removed';

export interface Aria2Task {
  gid: string;
  status: Aria2TaskStatus;
  totalLength: string;
  completedLength: string;
  uploadLength?: string;
  downloadSpeed: string;
  uploadSpeed: string;
  connections?: string;
  numSeeders?: string;
  seeder?: string;
  errorCode?: string;
  errorMessage?: string;
  dir?: string;
  files?: Array<{
    index: string;
    path: string;
    length: string;
    completedLength: string;
    selected: string;
    uris?: Array<{ status: string; uri: string }>;
  }>;
  bittorrent?: {
    info?: {
      name?: string;
    };
  };
}

export interface AddUriOptions {
  dir?: string;
  out?: string;
  referer?: string;
  header?: string[];
  'user-agent'?: string;
}

export interface AddDownloadInput {
  url: string;
  finalUrl?: string;
  filename?: string;
  referer?: string;
  cookie?: string;
  userAgent?: string;
  requestHeaders?: Array<{ name: string; value: string }>;
  dir?: string;
}

export interface ConnectionCheck {
  ok: boolean;
  version?: string;
  latencyMs?: number;
  code?: string;
  message: string;
}
