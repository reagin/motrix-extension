import type * as React from 'react';

import { ArrowDown, ArrowUp, CheckCircle2, Clock, Zap } from 'lucide-react';

import type { RuntimeState } from '@/src/lib/messages';

import { cn, formatSpeed } from '@/src/lib/utils';

import type { PopupTranslator } from '../types';

interface MetricsPanelProps {
  t: PopupTranslator;
  runtime: RuntimeState;
  captureEnabled: boolean;
}

export function MetricsPanel({ runtime, captureEnabled, t }: MetricsPanelProps) {
  const counts = {
    active: runtime.tasks.active.length,
    waiting: runtime.tasks.waiting.length,
    stopped: runtime.tasks.stopped.length,
  };
  const isIdle = (Number(runtime.stat?.numActive) || 0) === 0;

  return (
    <section data-reveal className={cn('px-4 transition-opacity duration-300', isIdle && 'opacity-75')}>
      <div className='flex items-center justify-center py-[18px] pb-3.5'>
        <div className='flex min-w-0 flex-1 items-center justify-center gap-1.5 text-primary'>
          <ArrowDown className='size-4 shrink-0' />
          <span className='metric-font truncate text-[22px] font-bold tracking-normal'>
            {formatSpeed(runtime.stat?.downloadSpeed)}
          </span>
        </div>
        <div className='h-6 w-px shrink-0 bg-border' />
        <div className='flex min-w-0 flex-1 items-center justify-center gap-1.5 text-muted-foreground'>
          <ArrowUp className='size-3.5 shrink-0' />
          <span className='metric-font truncate text-sm font-medium'>{formatSpeed(runtime.stat?.uploadSpeed)}</span>
        </div>
      </div>
      <div className={cn('flex items-center justify-around border-t py-2.5 transition-opacity duration-300', !captureEnabled && 'opacity-35')}>
        <StatCount icon={Zap} label={t('common.active')} value={counts.active} className='text-primary' />
        <StatCount icon={Clock} label={t('common.waiting')} value={counts.waiting} className='text-(--m3-warning)' />
        <StatCount icon={CheckCircle2} label={t('common.stopped')} value={counts.stopped} className='text-(--m3-success)' />
      </div>
    </section>
  );
}

function StatCount({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-1.5 text-xs', className)}>
      <Icon className='size-3.5' />
      <span className='font-medium'>{label}</span>
      <span className='metric-font min-w-4 text-center text-sm font-bold'>{value}</span>
    </div>
  );
}
