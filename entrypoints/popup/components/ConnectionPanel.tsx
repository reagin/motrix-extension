import type * as React from 'react';

import { CircleAlert, RefreshCw } from 'lucide-react';

import { cn } from '@/src/lib/utils';

import type { PopupTranslator } from '../types';

interface ConnectionPanelProps {
  port: number;
  t: PopupTranslator;
  errorMessage?: string;
}

export function ConnectingPanel({ port, t }: ConnectionPanelProps) {
  return (
    <RpcStatusCard
      tone='primary'
      icon={RefreshCw}
      title={t('popup.connectingTitle')}
      description={t('popup.connectingHint', { port })}
      status={t('popup.connectingStatus')}
      spinning
    >
      <div className='grid gap-2'>
        <ConnectionCheckItem label={t('popup.connectingConfig')} active={false} />
        <ConnectionCheckItem label={t('popup.connectingRpc')} active />
        <ConnectionCheckItem label={t('popup.connectingTasks')} active={false} />
      </div>
    </RpcStatusCard>
  );
}

export function OfflinePanel({ port, errorMessage, t }: ConnectionPanelProps) {
  return (
    <RpcStatusCard
      tone='warning'
      icon={CircleAlert}
      title={t('status.offline')}
      description={errorMessage || t('popup.connectionHint', { port })}
    />
  );
}

function RpcStatusCard({
  tone,
  icon: Icon,
  title,
  description,
  status,
  children,
  spinning = false,
}: {
  tone: 'primary' | 'warning';
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  status?: string;
  children?: React.ReactNode;
  spinning?: boolean;
}) {
  const isWarning = tone === 'warning';

  return (
    <section className='mx-3 mb-3 overflow-hidden rounded-xl border bg-(--m3-surface-container) shadow-(--m3-shadow-card)'>
      <div className='flex'>
        <div className={cn('w-1 shrink-0', isWarning ? 'bg-(--m3-warning)' : 'bg-primary')} />
        <div className='grid min-w-0 flex-1 grid-cols-[2rem_1fr] items-center gap-3 p-3.5'>
          <div
            className={cn(
              'relative flex size-8 shrink-0 items-center justify-center rounded-full',
              isWarning
                ? 'bg-[color-mix(in_srgb,var(--m3-warning)_15%,transparent)] text-(--m3-warning)'
                : 'bg-[color-mix(in_srgb,hsl(var(--primary))_14%,transparent)] text-primary',
            )}
          >
            {spinning ? <span className='absolute inset-0 rounded-full border border-primary/25' /> : null}
            <Icon className={cn('size-4', spinning && 'animate-spin')} />
          </div>
          <div className='min-w-0 self-center py-0.5'>
            <p className='text-[13px] leading-tight font-semibold'>{title}</p>
            <p className='mt-1.5 text-xs/relaxed text-muted-foreground'>
              {description}
            </p>
            {status
              ? (
                  <div className='mt-2 flex items-center gap-2'>
                    <span className='rpc-handshake-track' aria-hidden='true' />
                    <span className='metric-font text-[10px] font-semibold tracking-[0.04em] text-primary uppercase'>
                      {status}
                    </span>
                  </div>
                )
              : null}
          </div>
        </div>
      </div>
      {children
        ? (
            <div className='border-t bg-(--m3-surface-container-low) px-3.5 py-3'>
              {children}
            </div>
          )
        : null}
    </section>
  );
}

function ConnectionCheckItem({
  label,
  active,
}: {
  label: string;
  active: boolean;
}) {
  return (
    <div className='flex items-center gap-2 text-xs text-muted-foreground'>
      <span
        className={cn(
          'relative flex size-2.5 shrink-0 rounded-full',
          active ? 'bg-primary' : 'bg-border',
        )}
      >
        {active ? <span className='absolute inset-0 animate-ping rounded-full bg-primary/45' /> : null}
      </span>
      <span className={cn('min-w-0', active && 'font-medium text-foreground')}>{label}</span>
    </div>
  );
}
