import { Pause, Play, Trash2 } from 'lucide-react';

import type { Aria2Task } from '@/library/rpc';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn, formatBytes, formatSpeed, percent } from '@/library/utils';

import { getTaskName } from './task-name';

type TaskRowTone = 'active' | 'waiting' | 'stopped';

interface TaskRowProps {
  task: Aria2Task;
  tone: TaskRowTone;
  onPause: (gid: string) => void;
  onResume: (gid: string) => void;
  onRemove: (gid: string, status: Aria2Task['status']) => void;
}

const toneClassNames: Record<TaskRowTone, string> = {
  active: 'border-task-active/30 bg-[color-mix(in_srgb,hsl(var(--task-active))_7%,var(--m3-surface))] before:bg-task-active',
  waiting: 'border-[color-mix(in_srgb,var(--m3-warning)_35%,hsl(var(--border)))] bg-[color-mix(in_srgb,var(--m3-warning)_8%,var(--m3-surface))] before:bg-(--m3-warning)',
  stopped: 'border-task-stopped/30 bg-[color-mix(in_srgb,hsl(var(--task-stopped))_7%,var(--m3-surface))] before:bg-task-stopped',
};

export function TaskRow({ task, tone, onPause, onResume, onRemove }: TaskRowProps) {
  const progress = percent(task.completedLength, task.totalLength);
  const isActive = task.status === 'active';
  const isPaused = task.status === 'paused' || task.status === 'waiting';
  const taskName = getTaskName(task);
  const completedSize = formatBytes(task.completedLength);
  const totalSize = formatBytes(task.totalLength);
  const downloadSpeed = formatSpeed(task.downloadSpeed);
  const uploadSpeed = formatSpeed(task.uploadSpeed);
  return (
    <div
      data-reveal
      className={cn(
        'relative h-[92px] overflow-hidden rounded-lg border py-2 pr-3 pl-3.5 shadow-(--m3-shadow-card) transition-colors duration-200 before:absolute before:inset-y-2 before:left-1.5 before:w-1 before:rounded-full',
        toneClassNames[tone],
      )}
    >
      <div className='flex items-start justify-between gap-2'>
        <div className='min-w-0 flex-1 pt-0.5'>
          <div className='truncate text-[13px] leading-snug font-semibold' title={taskName}>{taskName}</div>
          <div className='mt-1 flex min-w-0 items-center gap-1.5 overflow-hidden text-xs text-muted-foreground'>
            <Badge variant={isActive ? 'good' : isPaused ? 'warn' : 'quiet'} className='shrink-0 rounded-full px-1.5 py-0 text-[10px] leading-4'>
              {task.status}
            </Badge>
            <span className='metric-font min-w-[5.25rem] max-w-[8.25rem] shrink truncate' title={`${completedSize} / ${totalSize}`}>
              {completedSize}
              {' '}
              /
              {totalSize}
            </span>
            {task.status === 'active' && !task.errorMessage
              ? (
                  <span className='metric-font ml-auto grid min-w-0 max-w-[9.75rem] shrink grid-cols-2 gap-1 overflow-hidden text-right text-[11px] leading-4'>
                    <span className='truncate text-speed-download' title={downloadSpeed}>
                      ↓
                      {downloadSpeed}
                    </span>
                    <span className='truncate text-speed-upload' title={uploadSpeed}>
                      ↑
                      {uploadSpeed}
                    </span>
                  </span>
                )
              : null}
          </div>
        </div>
        <div className='flex shrink-0 gap-1'>
          {isActive
            ? (
                <Button variant='quiet' size='icon' className='size-7 rounded-full' title='Pause' aria-label='Pause' onClick={() => onPause(task.gid)}>
                  <Pause />
                </Button>
              )
            : (
                <Button variant='quiet' size='icon' className='size-7 rounded-full' title='Resume' aria-label='Resume' onClick={() => onResume(task.gid)}>
                  <Play />
                </Button>
              )}
          <Button variant='quiet' size='icon' className='size-7 rounded-full' title='Remove' aria-label='Remove' onClick={() => onRemove(task.gid, task.status)}>
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
      <div className='mt-1 flex h-4 items-center overflow-hidden text-[11px] leading-4 text-muted-foreground'>
        {task.errorMessage
          ? (
              <span className='truncate text-destructive' title={task.errorMessage}>{task.errorMessage}</span>
            )
          : null}
      </div>
    </div>
  );
}
