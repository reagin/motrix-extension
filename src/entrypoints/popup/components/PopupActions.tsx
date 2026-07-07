import { Pause, Play, Power } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

import type { PopupTranslator } from '../types';

interface PopupActionsProps {
  busy: boolean;
  t: PopupTranslator;
  onPauseAll: () => void;
  onResumeAll: () => void;
  onWakeMotrix: () => void;
}

export function PopupActions({ busy, onPauseAll, onResumeAll, onWakeMotrix, t }: PopupActionsProps) {
  return (
    <>
      <Separator className='mt-3' />
      <div data-reveal className='flex items-center justify-between gap-2 p-3'>
        <Button
          variant='quiet'
          size='sm'
          disabled={busy}
          onClick={onPauseAll}
        >
          <Pause />
          {t('popup.pauseAll')}
        </Button>
        <Button
          variant='quiet'
          size='sm'
          disabled={busy}
          onClick={onResumeAll}
        >
          <Play />
          {t('popup.resumeAll')}
        </Button>
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
