import type { AddDownloadInput } from '@/library/rpc';
import type { StorageSnapshot } from '@/library/storage';

import { appendDiagnostic } from '@/library/storage';
import { Aria2RpcClient, RpcAuthError } from '@/library/rpc';
import { openMotrixNewTask, wakeMotrix } from '@/library/protocol/launcher';

export async function routeDownloadInput(
  input: AddDownloadInput,
  snapshot: StorageSnapshot,
  source: string,
): Promise<void> {
  const client = new Aria2RpcClient(snapshot.connection);
  try {
    const result = await client.addDownload(input);
    await appendDiagnostic({
      level: 'info',
      code: 'download_routed',
      message: `Routed to Motrix: ${input.finalUrl || input.url}`,
      context: { source, gid: result.gid, url: input.finalUrl || input.url, filename: input.filename },
    });
    return;
  } catch (error) {
    await appendDiagnostic({
      level: error instanceof RpcAuthError ? 'error' : 'warn',
      code: error instanceof RpcAuthError ? 'rpc_auth_failed' : 'rpc_route_failed',
      message: error instanceof Error ? error.message : String(error),
      context: { source, url: input.finalUrl || input.url },
    });
    if (error instanceof RpcAuthError || !snapshot.settings.autoLaunchApp) throw error;
  }

  await wakeMotrix().catch(() => undefined);
  await delay(1200);

  try {
    const retryClient = new Aria2RpcClient(snapshot.connection);
    const result = await retryClient.addDownload(input);
    await appendDiagnostic({
      level: 'info',
      code: 'download_routed_after_wake',
      message: `Routed to Motrix after wake: ${input.finalUrl || input.url}`,
      context: { source, gid: result.gid },
    });
  } catch (error) {
    await appendDiagnostic({
      level: 'warn',
      code: 'protocol_fallback',
      message: `Falling back to motrix:// for ${input.finalUrl || input.url}`,
      context: { source, error: error instanceof Error ? error.message : String(error) },
    });
    await openMotrixNewTask(input.finalUrl || input.url);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms);
  });
}
