import { Pause, Play, Trash2 } from 'lucide-react';

import type { Aria2Task } from '@/src/lib/rpc';

import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Progress } from '@/src/components/ui/progress';
import { formatBytes, formatSpeed, percent } from '@/src/lib/utils';

import { getTaskName } from './task-name';

interface TaskRowProps {
  task: Aria2Task;
  onPause: (gid: string) => void;
  onRemove: (gid: string) => void;
  onResume: (gid: string) => void;
}

export function TaskRow({ task, onPause, onResume, onRemove }: TaskRowProps) {
  const progress = percent(task.completedLength, task.totalLength);
  const isActive = task.status === 'active';
  const isPaused = task.status === 'paused' || task.status === 'waiting';
  return (
    <div data-reveal className='rounded-lg border bg-[var(--m3-surface)] px-3 py-2 shadow-[var(--m3-shadow-card)]'>
      <div className='flex items-start justify-between gap-2'>
        <div className='min-w-0'>
          <div className='truncate text-[13px] font-semibold leading-snug'>{getTaskName(task)}</div>
          <div className='mt-1 flex items-center gap-2 text-xs text-muted-foreground'>
            <Badge variant={isActive ? 'good' : isPaused ? 'warn' : 'quiet'} className='rounded-full px-1.5 py-0 text-[10px]'>
              {task.status}
            </Badge>
            <span className='metric-font'>
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
          <Button variant='quiet' size='icon' className='size-7 rounded-full' title='Remove' onClick={() => onRemove(task.gid)}>
            <Trash2 />
          </Button>
        </div>
      </div>
      <div className='mt-2 flex items-center gap-2'>
        <Progress value={progress} />
        <span className='metric-font w-10 text-right text-[11px] text-muted-foreground'>
          {progress.toFixed(0)}
          %
        </span>
      </div>
      {task.status === 'active'
        ? (
            <div className='mt-1 flex gap-3 text-[11px] text-muted-foreground'>
              <span className='metric-font text-speed-download'>
                ↓
                {formatSpeed(task.downloadSpeed)}
              </span>
              <span className='metric-font text-speed-upload'>
                ↑
                {formatSpeed(task.uploadSpeed)}
              </span>
            </div>
          )
        : null}
      {task.errorMessage ? <div className='mt-1 text-xs text-destructive'>{task.errorMessage}</div> : null}
    </div>
  );
}
