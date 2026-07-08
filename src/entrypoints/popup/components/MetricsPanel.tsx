import type * as React from 'react';

import { ArrowDown, ArrowUp, CheckCircle2, Clock, Zap } from 'lucide-react';

import type { RuntimeState } from '@/library/messages';

import { cn, formatSpeed } from '@/library/utils';

import type { PopupTranslator, TaskLane } from '../types';

interface MetricsPanelProps {
  t: PopupTranslator;
  activeLane: TaskLane;
  runtime: RuntimeState;
  captureEnabled: boolean;
  onLaneChange: (lane: TaskLane) => void;
}

export function MetricsPanel({ activeLane, runtime, captureEnabled, onLaneChange, t }: MetricsPanelProps) {
  const counts = {
    active: runtime.tasks.active.length,
    waiting: runtime.tasks.waiting.length,
    stopped: runtime.tasks.stopped.length,
  };
  const isIdle = (Number(runtime.stat?.numActive) || 0) === 0;

  return (
    <section data-reveal className={cn('px-4 transition-opacity duration-300', isIdle && 'opacity-75')}>
      <div className='flex items-center justify-center py-[18px] pb-3.5'>
        <div className='pointer-events-none flex min-w-0 flex-1 items-center justify-center gap-1.5 text-primary'>
          <ArrowDown className='size-4 shrink-0' />
          <span className='metric-font truncate text-[22px] font-bold tracking-normal'>
            {formatSpeed(runtime.stat?.downloadSpeed)}
          </span>
        </div>
        <div className='h-6 w-px shrink-0 bg-border' />
        <div className='pointer-events-none flex min-w-0 flex-1 items-center justify-center gap-1.5 text-muted-foreground'>
          <ArrowUp className='size-3.5 shrink-0' />
          <span className='metric-font truncate text-sm font-medium'>{formatSpeed(runtime.stat?.uploadSpeed)}</span>
        </div>
      </div>
      <div className={cn('grid grid-cols-3 gap-1.5 border-t py-2.5 transition-opacity duration-300', !captureEnabled && 'opacity-45')}>
        <StatCount
          icon={Zap}
          label={t('common.active')}
          value={counts.active}
          selected={activeLane === 'active'}
          onSelect={() => onLaneChange('active')}
          className='text-primary'
        />
        <StatCount
          icon={Clock}
          label={t('common.waiting')}
          value={counts.waiting}
          selected={activeLane === 'waiting'}
          onSelect={() => onLaneChange('waiting')}
          className='text-(--m3-warning)'
        />
        <StatCount
          icon={CheckCircle2}
          label={t('common.stopped')}
          value={counts.stopped}
          selected={activeLane === 'stopped'}
          onSelect={() => onLaneChange('stopped')}
          className='text-(--m3-success)'
        />
      </div>
    </section>
  );
}

function StatCount({
  icon: Icon,
  label,
  value,
  selected,
  onSelect,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  selected: boolean;
  onSelect: () => void;
  className?: string;
}) {
  return (
    <button
      type='button'
      aria-pressed={selected}
      aria-label={`${label} ${value}`}
      data-selected={selected}
      onClick={onSelect}
      className={cn(
        'flex h-11 min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-transparent px-2 text-xs transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'hover:bg-[color-mix(in_srgb,var(--m3-on-surface)_6%,transparent)]',
        'data-[selected=true]:border-current data-[selected=true]:bg-(--m3-surface-container-lowest) data-[selected=true]:shadow-(--m3-shadow-card)',
        className,
      )}
    >
      <Icon className='size-3.5 shrink-0' />
      <span className='font-medium'>{label}</span>
      <span className='metric-font min-w-4 text-center text-sm font-bold'>{value}</span>
    </button>
  );
}
