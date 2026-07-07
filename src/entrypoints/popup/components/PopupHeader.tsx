import { Activity, RefreshCw, Settings } from 'lucide-react';

import type { StorageSnapshot } from '@/library/storage';

import { cn } from '@/library/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

import type { PopupStatus, PopupTranslator } from '../types';

interface PopupHeaderProps {
  version?: string;
  t: PopupTranslator;
  status: PopupStatus;
  onRefresh: () => void;
  onOpenOptions: () => void;
  snapshot: StorageSnapshot;
  onToggleCapture: (enabled: boolean) => void;
}

export function PopupHeader({
  snapshot,
  status,
  version,
  onToggleCapture,
  onRefresh,
  onOpenOptions,
  t,
}: PopupHeaderProps) {
  const isConnecting = status === 'connecting';
  const isConnected = status === 'connected';

  return (
    <header className='flex items-center justify-between gap-2 px-3 py-2.5'>
      <div className='flex min-w-0 items-center gap-2'>
        <div className='pointer-events-none flex size-7 shrink-0 items-center justify-center rounded-full text-primary'>
          <Activity className='size-5' />
        </div>
        <Badge
          variant={isConnecting ? 'warn' : isConnected ? 'good' : 'destructive'}
          className='rounded-full px-2 py-0.5 text-[10px] font-semibold'
        >
          {isConnecting ? t('status.checking') : isConnected ? t('common.connected') : t('common.disconnected')}
        </Badge>
        {version
          ? (
              <span className='pointer-events-none metric-font truncate text-[11px] text-muted-foreground'>
                v
                {version}
              </span>
            )
          : null}
      </div>

      <div className='flex shrink-0 items-center gap-1.5'>
        <div className='flex items-center gap-1.5'>
          <span className='pointer-events-none relative grid min-w-[66px] text-right text-[11px] font-semibold'>
            <span
              className={cn(
                'col-start-1 row-start-1 text-(--m3-success) transition-all duration-300',
                snapshot.settings.enabled ? 'translate-y-0 opacity-100' : '-translate-y-1.5 opacity-0',
              )}
            >
              {t('popup.captureOn')}
            </span>
            <span
              className={cn(
                'col-start-1 row-start-1 text-muted-foreground transition-all duration-300',
                snapshot.settings.enabled ? 'translate-y-1.5 opacity-0' : 'translate-y-0 opacity-100',
              )}
            >
              {t('popup.captureOff')}
            </span>
          </span>
          <Switch
            checked={snapshot.settings.enabled}
            onCheckedChange={onToggleCapture}
          />
        </div>
        <Button
          variant='quiet'
          size='icon'
          className='rounded-full'
          disabled={isConnecting}
          onClick={onRefresh}
          title={t('common.retry')}
        >
          <RefreshCw className={cn(isConnecting && 'animate-spin')} />
        </Button>
        <Button
          variant='quiet'
          size='icon'
          className='rounded-full'
          onClick={onOpenOptions}
          title={t('common.settings')}
        >
          <Settings />
        </Button>
      </div>
    </header>
  );
}
