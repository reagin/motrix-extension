import type { AddDownloadInput } from '@/library/rpc';
import type { StorageSnapshot } from '@/library/storage';

import { appendDiagnostic } from '@/library/storage';
import { Aria2RpcClient, RpcAuthError } from '@/library/rpc';
import { openMotrixNewTask } from '@/library/protocol/launcher';

export async function routeDownloadInput(
  input: AddDownloadInput,
  snapshot: StorageSnapshot,
  source: string,
): Promise<void> {
  const taskUrl = input.url;
  const context = input.finalUrl && input.finalUrl !== taskUrl
    ? { source, url: taskUrl, finalUrl: input.finalUrl, filename: input.filename }
    : { source, url: taskUrl, filename: input.filename };
  const client = new Aria2RpcClient(snapshot.connection);
  try {
    const result = await client.addDownload(input);
    await appendDiagnostic({
      level: 'info',
      code: 'download_routed',
      message: `Routed to Motrix: ${taskUrl}`,
      context: { ...context, gid: result.gid },
    });
    return;
  } catch (error) {
    await appendDiagnostic({
      level: error instanceof RpcAuthError ? 'error' : 'warn',
      code: error instanceof RpcAuthError ? 'rpc_auth_failed' : 'rpc_route_failed',
      message: error instanceof Error ? error.message : String(error),
      context,
    });
    if (error instanceof RpcAuthError || !snapshot.settings.autoLaunchApp) throw error;
  }

  await appendDiagnostic({
    level: 'warn',
    code: 'protocol_fallback',
    message: `Falling back to motrix:// for ${taskUrl}`,
    context,
  });
  await openMotrixNewTask(taskUrl);
}
