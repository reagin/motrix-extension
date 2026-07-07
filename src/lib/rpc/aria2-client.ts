import { z } from 'zod';

import type { ConnectionConfig } from '@/src/lib/storage';

import type {
  AddDownloadInput,
  AddUriOptions,
  Aria2GlobalStat,
  Aria2Task,
  Aria2Version,
  ConnectionCheck,
} from './types';

import {
  RpcAuthError,
  RpcConnectionError,
  RpcError,
  RpcInvalidResponseError,
  RpcTimeoutError,
} from './errors';

const RpcSuccessSchema = z.object({
  jsonrpc: z.string().optional(),
  id: z.union([z.string(), z.number()]).nullable().optional(),
  result: z.unknown().optional(),
  error: z
    .object({
      code: z.number(),
      message: z.string(),
    })
    .optional(),
});

const VersionSchema = z.object({
  version: z.string(),
  enabledFeatures: z.array(z.string()).default([]),
});

const GlobalStatSchema = z.object({
  downloadSpeed: z.string(),
  uploadSpeed: z.string(),
  numActive: z.string(),
  numWaiting: z.string(),
  numStopped: z.string(),
  numStoppedTotal: z.string(),
});

const TaskSchema = z.object({
  gid: z.string(),
  status: z.enum(['active', 'waiting', 'paused', 'error', 'complete', 'removed']),
  totalLength: z.string().default('0'),
  completedLength: z.string().default('0'),
  uploadLength: z.string().optional(),
  downloadSpeed: z.string().default('0'),
  uploadSpeed: z.string().default('0'),
  connections: z.string().optional(),
  numSeeders: z.string().optional(),
  seeder: z.string().optional(),
  errorCode: z.string().optional(),
  errorMessage: z.string().optional(),
  dir: z.string().optional(),
  files: z
    .array(
      z.object({
        index: z.string(),
        path: z.string().default(''),
        length: z.string().default('0'),
        completedLength: z.string().default('0'),
        selected: z.string().default('true'),
        uris: z.array(z.object({ status: z.string(), uri: z.string() })).optional(),
      }),
    )
    .optional(),
  bittorrent: z.object({ info: z.object({ name: z.string().optional() }).optional() }).optional(),
});

const TASK_KEYS = [
  'gid',
  'status',
  'totalLength',
  'completedLength',
  'uploadLength',
  'downloadSpeed',
  'uploadSpeed',
  'connections',
  'numSeeders',
  'seeder',
  'errorCode',
  'errorMessage',
  'dir',
  'files',
  'bittorrent',
];

export class Aria2RpcClient {
  constructor(private config: ConnectionConfig) {}

  updateConfig(config: ConnectionConfig): void {
    this.config = config;
  }

  get endpoint(): string {
    const path = this.config.path.startsWith('/') ? this.config.path : `/${this.config.path}`;
    return `http://${this.config.host}:${this.config.port}${path}`;
  }

  async checkConnection(): Promise<ConnectionCheck> {
    const started = performance.now();
    try {
      const version = await this.getVersion();
      return {
        ok: true,
        version: version.version,
        latencyMs: Math.round(performance.now() - started),
        message: `aria2 ${version.version}`,
      };
    } catch (error) {
      return {
        ok: false,
        code: error instanceof RpcError ? error.code : 'rpc_error',
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async getVersion(): Promise<Aria2Version> {
    return VersionSchema.parse(await this.call('aria2.getVersion'));
  }

  async getGlobalStat(): Promise<Aria2GlobalStat> {
    return GlobalStatSchema.parse(await this.call('aria2.getGlobalStat'));
  }

  async tellActive(): Promise<Aria2Task[]> {
    return z.array(TaskSchema).parse(await this.call('aria2.tellActive', TASK_KEYS));
  }

  async tellWaiting(offset = 0, num = 20): Promise<Aria2Task[]> {
    return z.array(TaskSchema).parse(await this.call('aria2.tellWaiting', offset, num, TASK_KEYS));
  }

  async tellStopped(offset = 0, num = 20): Promise<Aria2Task[]> {
    return z.array(TaskSchema).parse(await this.call('aria2.tellStopped', offset, num, TASK_KEYS));
  }

  async addDownload(input: AddDownloadInput): Promise<{ gid: string }> {
    const url = input.finalUrl || input.url;
    const options = buildAddUriOptions(input);
    const result = z.string().parse(await this.call('aria2.addUri', [url], options));
    return { gid: result };
  }

  pause(gid: string): Promise<unknown> {
    return this.call('aria2.pause', gid);
  }

  resume(gid: string): Promise<unknown> {
    return this.call('aria2.unpause', gid);
  }

  remove(gid: string): Promise<unknown> {
    return this.call('aria2.remove', gid);
  }

  pauseAll(): Promise<unknown> {
    return this.call('aria2.pauseAll');
  }

  resumeAll(): Promise<unknown> {
    return this.call('aria2.unpauseAll');
  }

  async call(method: string, ...params: unknown[]): Promise<unknown> {
    const controller = new AbortController();
    const timeout = globalThis.setTimeout(() => controller.abort(), this.config.timeoutMs);
    const rpcParams = this.config.secret ? [`token:${this.config.secret}`, ...params] : params;
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: crypto.randomUUID(),
          method,
          params: rpcParams,
        }),
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new RpcConnectionError(`HTTP ${response.status}`);
      }
      const payload = RpcSuccessSchema.parse(await response.json());
      if (payload.error) {
        if (payload.error.code === 1 || /unauthorized|token|secret/i.test(payload.error.message)) {
          throw new RpcAuthError(payload.error);
        }
        throw new RpcError(payload.error.message, `aria2_${payload.error.code}`, payload.error);
      }
      return payload.result;
    } catch (error) {
      if (error instanceof RpcError) throw error;
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new RpcTimeoutError(this.config.timeoutMs, error);
      }
      if (error instanceof z.ZodError) {
        throw new RpcInvalidResponseError(error);
      }
      throw new RpcConnectionError(error);
    } finally {
      globalThis.clearTimeout(timeout);
    }
  }
}

export function buildAddUriOptions(input: AddDownloadInput): AddUriOptions {
  const headers = new Map<string, string>();
  for (const header of input.requestHeaders ?? []) {
    if (header.name && header.value) headers.set(header.name.toLowerCase(), `${header.name}: ${header.value}`);
  }
  if (input.cookie) headers.set('cookie', `Cookie: ${input.cookie}`);
  const options: AddUriOptions = {};
  const headerList = [...headers.values()];
  if (headerList.length) options.header = headerList;
  if (input.referer) options.referer = input.referer;
  if (input.userAgent) options['user-agent'] = input.userAgent;
  if (input.filename) options.out = input.filename;
  if (input.dir) options.dir = input.dir;
  return options;
}

export function parseRpcUrl(value: string): Partial<ConnectionConfig> {
  const parsed = new URL(value);
  return {
    host: parsed.hostname || '127.0.0.1',
    port: Number(parsed.port || 16800),
    path: parsed.pathname || '/jsonrpc',
    secret: parsed.username === 'token' ? decodeURIComponent(parsed.password) : '',
  };
}
