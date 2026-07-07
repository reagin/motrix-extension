import { Aria2RpcClient } from '@/library/rpc';
import { loadSnapshot } from '@/library/storage';

export async function performTaskAction(action: 'pause' | 'resume' | 'remove', gid: string): Promise<void> {
  await withClient((client) => {
    if (action === 'pause') return client.pause(gid);
    if (action === 'resume') return client.resume(gid);
    return client.remove(gid);
  });
}

export async function withClient<T>(operation: (client: Aria2RpcClient) => Promise<T>): Promise<T> {
  const snapshot = await loadSnapshot();
  return operation(new Aria2RpcClient(snapshot.connection));
}
