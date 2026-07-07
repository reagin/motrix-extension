import type { Aria2Task } from '@/library/rpc';

export function getTaskName(task: Aria2Task): string {
  const btName = task.bittorrent?.info?.name;
  if (btName) return btName;
  const selectedFile = task.files?.find((file) => file.selected === 'true') ?? task.files?.[0];
  if (selectedFile?.path) {
    return selectedFile.path.split(/[\\/]/).filter(Boolean).pop() || selectedFile.path;
  }
  return task.gid;
}
