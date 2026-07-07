import { toast, Toaster } from 'sonner';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Clock,
  Pause,
  Play,
  Power,
  RefreshCw,
  Settings,
  Zap,
} from 'lucide-react';

import type { RuntimeState } from '@/src/lib/messages';

import { useI18n } from '@/src/hooks/use-i18n';
import { useTheme } from '@/src/hooks/use-theme';
import { Badge } from '@/src/components/ui/badge';
import { cn, formatSpeed } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';
import { Switch } from '@/src/components/ui/switch';
import { sendRuntimeMessage } from '@/src/lib/runtime';
import { Separator } from '@/src/components/ui/separator';
import { TaskRow } from '@/src/components/motrix/task-row';
import { ScrollArea } from '@/src/components/ui/scroll-area';
import { useAnimeReveal } from '@/src/hooks/use-anime-reveal';
import { DEFAULT_STORAGE, type StorageSnapshot } from '@/src/lib/storage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';

const REFRESH_MS = 5000;

export default function App() {
  const [snapshot, setSnapshot] = useState<StorageSnapshot>(DEFAULT_STORAGE);
  const [runtime, setRuntime] = useState<RuntimeState | null>(null);
  const [runtimeLoading, setRuntimeLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const refreshInFlightRef = useRef(false);
  const locale = snapshot.ui.locale;
  const { t } = useI18n(locale);
  useTheme(snapshot.ui);
  const revealRef = useAnimeReveal<HTMLDivElement>(snapshot.ui.motion, 'popup-open');

  const refreshRuntime = useCallback(async (quiet = false) => {
    if (refreshInFlightRef.current) return;
    refreshInFlightRef.current = true;
    if (!quiet) setRuntimeLoading(true);
    try {
      const response = await sendRuntimeMessage({ type: 'runtime-state' });
      if (response.ok && response.runtime) setRuntime(response.runtime);
    } finally {
      refreshInFlightRef.current = false;
      if (!quiet) setRuntimeLoading(false);
    }
  }, []);

  const refreshSnapshot = useCallback(async () => {
    const response = await sendRuntimeMessage({ type: 'settings-snapshot' });
    if (response.ok && response.snapshot) setSnapshot(response.snapshot);
  }, []);

  useEffect(() => {
    void refreshSnapshot();
    const initialRuntimeTimer = globalThis.setTimeout(() => {
      void refreshRuntime();
    }, 0);
    const timer = globalThis.setInterval(() => {
      void refreshRuntime(true);
    }, REFRESH_MS);
    return () => {
      globalThis.clearTimeout(initialRuntimeTimer);
      globalThis.clearInterval(timer);
    };
  }, [refreshRuntime, refreshSnapshot]);

  const updateInterception = async (enabled: boolean) => {
    setSnapshot((current) => ({
      ...current,
      settings: { ...current.settings, enabled },
    }));
    const response = await sendRuntimeMessage({ type: 'update-settings', patch: { enabled } });
    if (response.ok) {
      if (response.snapshot) setSnapshot(response.snapshot);
    }
  };

  const runAction = async (label: string, action: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await action();
      await refreshRuntime(true);
      toast.success(label);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  };

  const openOptions = () => {
    void browser.runtime.openOptionsPage();
  };

  const counts = useMemo(
    () => ({
      active: runtime?.tasks.active.length ?? 0,
      waiting: runtime?.tasks.waiting.length ?? 0,
      stopped: runtime?.tasks.stopped.length ?? 0,
    }),
    [runtime?.tasks.active.length, runtime?.tasks.waiting.length, runtime?.tasks.stopped.length],
  );

  const isConnected = Boolean(runtime?.connection.ok);
  const isIdle = (Number(runtime?.stat?.numActive) || 0) === 0;

  return (
    <div className='w-[380px] bg-[var(--m3-surface)] text-foreground'>
      <Toaster richColors position='top-center' />
      <header className='flex items-center justify-between px-3 py-3'>
        <div className='flex min-w-0 items-center gap-2'>
          <div className='flex size-7 shrink-0 items-center justify-center rounded-full text-primary'>
            <Activity className='size-5' />
          </div>
          <Badge variant={isConnected ? 'good' : 'destructive'} className='rounded-full px-2 py-0.5 text-[10px] font-semibold'>
            {isConnected ? t('common.connected') : t('common.disconnected')}
          </Badge>
          {runtime?.connection.version
            ? (
                <span className='metric-font text-[11px] text-muted-foreground'>
                  v
                  {runtime.connection.version}
                </span>
              )
            : null}
        </div>
        <div className='flex shrink-0 items-center gap-1.5'>
          <div className='flex items-center gap-1.5'>
            <span className='relative grid min-w-[70px] text-right text-[11px] font-semibold'>
              <span
                className={cn(
                  'col-start-1 row-start-1 text-[var(--m3-success)] transition-all duration-300',
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
              onCheckedChange={(checked) => void updateInterception(checked)}
            />
          </div>
          <Button
            variant='quiet'
            size='icon'
            className='rounded-full'
            disabled={runtimeLoading}
            onClick={() => void refreshRuntime()}
            title={t('common.retry')}
          >
            <RefreshCw className={cn(runtimeLoading && 'animate-spin')} />
          </Button>
          <Button
            variant='quiet'
            size='icon'
            className='rounded-full'
            onClick={openOptions}
            title={t('common.settings')}
          >
            <Settings />
          </Button>
        </div>
      </header>

      <div ref={revealRef}>
        {!isConnected
          ? (
              <section
                data-reveal
                className='mx-3 mb-3 overflow-hidden rounded-xl border bg-[var(--m3-surface-container)] shadow-[var(--m3-shadow-card)]'
              >
                <div className='flex'>
                  <div className='w-1 shrink-0 bg-[var(--m3-warning)]' />
                  <div className='min-w-0 px-3.5 py-3'>
                    <p className='text-[13px] font-semibold leading-tight'>{t('status.offline')}</p>
                    <p className='mt-1.5 text-xs leading-relaxed text-muted-foreground'>
                      {t('popup.connectionHint', { port: snapshot.connection.port })}
                    </p>
                  </div>
                </div>
              </section>
            )
          : (
              <>
                <section data-reveal className={cn('px-4 transition-opacity duration-300', isIdle && 'opacity-75')}>
                  <div className='flex items-center justify-center py-[18px] pb-3.5'>
                    <div className='flex flex-1 items-center justify-center gap-1.5 text-primary'>
                      <ArrowDown className='size-4 shrink-0' />
                      <span className='metric-font text-[22px] font-bold tracking-[-0.02em]'>
                        {formatSpeed(runtime?.stat?.downloadSpeed)}
                      </span>
                    </div>
                    <div className='h-6 w-px shrink-0 bg-border' />
                    <div className='flex flex-1 items-center justify-center gap-1.5 text-muted-foreground'>
                      <ArrowUp className='size-3.5 shrink-0' />
                      <span className='metric-font text-sm font-medium'>{formatSpeed(runtime?.stat?.uploadSpeed)}</span>
                    </div>
                  </div>
                  <div className={cn('flex items-center justify-around border-t py-2.5 transition-opacity duration-300', !snapshot.settings.enabled && 'opacity-35')}>
                    <StatCount icon={Zap} label={t('common.active')} value={counts.active} className='text-primary' />
                    <StatCount icon={Clock} label={t('common.waiting')} value={counts.waiting} className='text-[var(--m3-warning)]' />
                    <StatCount icon={CheckCircle2} label={t('common.stopped')} value={counts.stopped} className='text-[var(--m3-success)]' />
                  </div>
                </section>

                <section data-reveal className='mx-3 mt-2 rounded-xl border bg-[var(--m3-surface-container)] p-2.5 shadow-[var(--m3-shadow-card)]'>
                  <Tabs defaultValue='active'>
                    <div className='flex items-center justify-between gap-2'>
                      <TabsList className='grid h-8 flex-1 grid-cols-3 bg-[var(--m3-surface-container-high)]'>
                        <TabsTrigger value='active'>
                          {t('common.active')}
                          {' '}
                          <span className='ml-1 text-xs text-muted-foreground'>{counts.active}</span>
                        </TabsTrigger>
                        <TabsTrigger value='waiting'>
                          {t('common.waiting')}
                          {' '}
                          <span className='ml-1 text-xs text-muted-foreground'>{counts.waiting}</span>
                        </TabsTrigger>
                        <TabsTrigger value='stopped'>
                          {t('common.stopped')}
                          {' '}
                          <span className='ml-1 text-xs text-muted-foreground'>{counts.stopped}</span>
                        </TabsTrigger>
                      </TabsList>
                    </div>
                    <TaskList
                      value='active'
                      tasks={runtime?.tasks.active ?? []}
                      empty={t('popup.noTasks')}
                      onPause={(gid) => void runAction(t('common.pause'), () => sendRuntimeMessage({ type: 'task-action', action: 'pause', gid }))}
                      onResume={(gid) => void runAction(t('common.resume'), () => sendRuntimeMessage({ type: 'task-action', action: 'resume', gid }))}
                      onRemove={(gid) => void runAction(t('common.remove'), () => sendRuntimeMessage({ type: 'task-action', action: 'remove', gid }))}
                    />
                    <TaskList
                      value='waiting'
                      tasks={runtime?.tasks.waiting ?? []}
                      empty={t('popup.noTasks')}
                      onPause={(gid) => void runAction(t('common.pause'), () => sendRuntimeMessage({ type: 'task-action', action: 'pause', gid }))}
                      onResume={(gid) => void runAction(t('common.resume'), () => sendRuntimeMessage({ type: 'task-action', action: 'resume', gid }))}
                      onRemove={(gid) => void runAction(t('common.remove'), () => sendRuntimeMessage({ type: 'task-action', action: 'remove', gid }))}
                    />
                    <TaskList
                      value='stopped'
                      tasks={runtime?.tasks.stopped ?? []}
                      empty={t('popup.noTasks')}
                      onPause={(gid) => void runAction(t('common.pause'), () => sendRuntimeMessage({ type: 'task-action', action: 'pause', gid }))}
                      onResume={(gid) => void runAction(t('common.resume'), () => sendRuntimeMessage({ type: 'task-action', action: 'resume', gid }))}
                      onRemove={(gid) => void runAction(t('common.remove'), () => sendRuntimeMessage({ type: 'task-action', action: 'remove', gid }))}
                    />
                  </Tabs>
                </section>

                <Separator className='mt-3' />

                <div data-reveal className='flex items-center justify-between gap-2 px-3 py-3'>
                  <Button
                    variant='quiet'
                    size='sm'
                    disabled={busy}
                    onClick={() => void runAction(t('popup.pauseAll'), () => sendRuntimeMessage({ type: 'pause-all' }))}
                  >
                    <Pause />
                    {t('popup.pauseAll')}
                  </Button>
                  <Button
                    variant='quiet'
                    size='sm'
                    disabled={busy}
                    onClick={() => void runAction(t('popup.resumeAll'), () => sendRuntimeMessage({ type: 'resume-all' }))}
                  >
                    <Play />
                    {t('popup.resumeAll')}
                  </Button>
                  <Button
                    size='sm'
                    onClick={() => void runAction(t('common.openMotrix'), () => sendRuntimeMessage({ type: 'wake-motrix' }))}
                  >
                    <Power />
                    {t('common.openMotrix')}
                  </Button>
                </div>
              </>
            )}
      </div>
    </div>
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

function TaskList({
  value,
  tasks,
  empty,
  onPause,
  onResume,
  onRemove,
}: {
  value: string;
  tasks: RuntimeState['tasks']['active'];
  empty: string;
  onPause: (gid: string) => void;
  onResume: (gid: string) => void;
  onRemove: (gid: string) => void;
}) {
  return (
    <TabsContent value={value}>
      <ScrollArea className='h-[238px] pr-2'>
        {tasks.length
          ? (
              <div className='space-y-2'>
                {tasks.map((task) => (
                  <TaskRow
                    key={task.gid}
                    task={task}
                    onPause={onPause}
                    onResume={onResume}
                    onRemove={onRemove}
                  />
                ))}
              </div>
            )
          : (
              <div className='flex h-[220px] items-center justify-center rounded-md border border-dashed bg-[var(--m3-surface)] text-center text-sm text-muted-foreground'>
                {empty}
              </div>
            )}
      </ScrollArea>
    </TabsContent>
  );
}
