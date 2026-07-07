import { Pause, Play, Power, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

import type { PopupTranslator, TaskLane } from '../types';

interface PopupActionsProps {
  busy: boolean;
  taskCount: number;
  t: PopupTranslator;
  activeLane: TaskLane;
  onClearAll: () => void;
  onPauseAll: () => void;
  onResumeAll: () => void;
  onWakeMotrix: () => void;
}

export function PopupActions({
  activeLane,
  busy,
  onClearAll,
  onPauseAll,
  onResumeAll,
  onWakeMotrix,
  taskCount,
  t,
}: PopupActionsProps) {
  const showPauseAll = activeLane === 'active';
  const showResumeAll = activeLane === 'waiting';
  const hasTasks = taskCount > 0;

  return (
    <>
      <Separator className='mt-3' />
      <div data-reveal className='flex items-center justify-between gap-2 p-3'>
        <div className='flex min-w-0 items-center gap-2'>
          {showPauseAll
            ? (
                <Button
                  variant='quiet'
                  size='sm'
                  disabled={busy || !hasTasks}
                  onClick={onPauseAll}
                >
                  <Pause />
                  {t('popup.pauseAll')}
                </Button>
              )
            : null}
          {showResumeAll
            ? (
                <Button
                  variant='quiet'
                  size='sm'
                  disabled={busy || !hasTasks}
                  onClick={onResumeAll}
                >
                  <Play />
                  {t('popup.resumeAll')}
                </Button>
              )
            : null}
          <Button
            variant='quiet'
            size='sm'
            disabled={busy || !hasTasks}
            onClick={onClearAll}
          >
            <Trash2 />
            {t('popup.clearAll')}
          </Button>
        </div>
        <Button
          size='sm'
          onClick={onWakeMotrix}
        >
          <Power />
          {t('common.openMotrix')}
        </Button>
      </div>
    </>
  );
}
