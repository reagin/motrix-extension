import { Pause, Play, Trash2 } from 'lucide-react';

import type { Aria2Task } from '@/library/rpc';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatBytes, formatSpeed, percent } from '@/library/utils';

import { getTaskName } from './task-name';

interface TaskRowProps {
  task: Aria2Task;
  onPause: (gid: string) => void;
  onResume: (gid: string) => void;
  onRemove: (gid: string, status: Aria2Task['status']) => void;
}

export function TaskRow({ task, onPause, onResume, onRemove }: TaskRowProps) {
  const progress = percent(task.completedLength, task.totalLength);
  const isActive = task.status === 'active';
  const isPaused = task.status === 'paused' || task.status === 'waiting';
  return (
    <div data-reveal className='h-[92px] overflow-hidden rounded-lg border bg-(--m3-surface) px-3 py-2 shadow-(--m3-shadow-card)'>
      <div className='flex items-start justify-between gap-2'>
        <div className='min-w-0'>
          <div className='pointer-events-none truncate text-[13px] leading-snug font-semibold'>{getTaskName(task)}</div>
          <div className='pointer-events-none mt-1 flex items-center gap-2 text-xs text-muted-foreground'>
            <Badge variant={isActive ? 'good' : isPaused ? 'warn' : 'quiet'} className='rounded-full px-1.5 py-0 text-[10px]'>
              {task.status}
            </Badge>
            <span className='metric-font min-w-0 truncate'>
              {formatBytes(task.completedLength)}
              {' '}
              /
              {formatBytes(task.totalLength)}
            </span>
          </div>
        </div>
        <div className='flex shrink-0 gap-1'>
          {isActive
            ? (
                <Button variant='quiet' size='icon' className='size-7 rounded-full' title='Pause' onClick={() => onPause(task.gid)}>
                  <Pause />
                </Button>
              )
            : (
                <Button variant='quiet' size='icon' className='size-7 rounded-full' title='Resume' onClick={() => onResume(task.gid)}>
                  <Play />
                </Button>
              )}
          <Button variant='quiet' size='icon' className='size-7 rounded-full' title='Remove' onClick={() => onRemove(task.gid, task.status)}>
            <Trash2 />
          </Button>
        </div>
      </div>
      <div className='mt-2 flex items-center gap-2'>
        <Progress value={progress} />
        <span className='metric-font pointer-events-none w-10 text-right text-[11px] text-muted-foreground'>
          {progress.toFixed(0)}
          %
        </span>
      </div>
      <div className='pointer-events-none mt-1 flex h-4 items-center gap-3 overflow-hidden text-[11px] leading-4 text-muted-foreground'>
        {task.errorMessage
          ? (
              <span className='truncate text-destructive' title={task.errorMessage}>{task.errorMessage}</span>
            )
          : task.status === 'active'
            ? (
                <>
                  <span className='metric-font text-speed-download'>
                    ↓
                    {formatSpeed(task.downloadSpeed)}
                  </span>
                  <span className='metric-font text-speed-upload'>
                    ↑
                    {formatSpeed(task.uploadSpeed)}
                  </span>
                </>
              )
            : null}
      </div>
    </div>
  );
}
