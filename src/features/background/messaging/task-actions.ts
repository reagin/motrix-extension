import type { Aria2TaskStatus } from '@/library/rpc';
import type { RuntimeTaskLane } from '@/library/messages';

import { Aria2RpcClient } from '@/library/rpc';
import { loadSnapshot } from '@/library/storage';

export async function performTaskAction(
  action: 'pause' | 'resume' | 'remove',
  gid: string,
  status?: Aria2TaskStatus,
): Promise<void> {
  await withClient((client) => {
    if (action === 'pause') return client.pause(gid);
    if (action === 'resume') return client.resume(gid);
    if (isDownloadResultStatus(status)) return client.removeDownloadResult(gid);
    return client.remove(gid);
  });
}

export async function clearTasks(lane: RuntimeTaskLane, gids: string[]): Promise<void> {
  await withClient(async (client) => {
    if (lane === 'stopped') {
      await client.purgeDownloadResult();
      return;
    }
    await Promise.all(gids.map((gid) => client.remove(gid)));
  });
}

export async function pauseTasks(gids: string[]): Promise<void> {
  await withClient(async (client) => {
    await Promise.all(gids.map((gid) => client.pause(gid)));
  });
}

function isDownloadResultStatus(status?: Aria2TaskStatus): boolean {
  return status === 'complete' || status === 'error' || status === 'removed';
}

export async function withClient<T>(operation: (client: Aria2RpcClient) => Promise<T>): Promise<T> {
  const snapshot = await loadSnapshot();
  return operation(new Aria2RpcClient(snapshot.connection));
}
