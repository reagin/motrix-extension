import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  Gauge,
  Languages,
  Pause,
  Play,
  Plus,
  Power,
  RefreshCw,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import type { RuntimeState } from '@/src/lib/messages';
import type { Locale } from '@/src/lib/i18n/dictionaries';
import { localeLabels } from '@/src/lib/i18n/dictionaries';
import { DEFAULT_STORAGE, type StorageSnapshot } from '@/src/lib/storage';
import { sendRuntimeMessage } from '@/src/lib/runtime';
import { useI18n } from '@/src/hooks/use-i18n';
import { useTheme } from '@/src/hooks/use-theme';
import { useAnimeReveal } from '@/src/hooks/use-anime-reveal';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Input } from '@/src/components/ui/input';
import { ScrollArea } from '@/src/components/ui/scroll-area';
import { Separator } from '@/src/components/ui/separator';
import { Switch } from '@/src/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { TaskRow } from '@/src/components/motrix/task-row';
import { StatusDot } from '@/src/components/motrix/status-dot';
import { cn, formatSpeed } from '@/src/lib/utils';

const REFRESH_MS = 5000;

export default function App() {
  const [snapshot, setSnapshot] = useState<StorageSnapshot>(DEFAULT_STORAGE);
  const [runtime, setRuntime] = useState<RuntimeState | null>(null);
  const [runtimeLoading, setRuntimeLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState('');
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
      toast.success(enabled ? t('popup.captureOn') : t('popup.captureOff'));
    }
  };

  const updateLocale = async (nextLocale: Locale) => {
    setSnapshot((current) => ({
      ...current,
      ui: { ...current.ui, locale: nextLocale },
    }));
    const response = await sendRuntimeMessage({ type: 'update-ui', patch: { locale: nextLocale } });
    if (response.ok && response.snapshot) setSnapshot(response.snapshot);
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

  const addTask = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    await runAction(t('popup.sent'), async () => {
      const response = await sendRuntimeMessage({ type: 'add-url', url: trimmed });
      if (!response.ok) throw new Error(response.message);
      setUrl('');
    });
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

  return (
    <div className="w-[400px] bg-background text-foreground">
      <Toaster richColors position="top-center" />
      <div className="border-b bg-card px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Gauge className="size-4" />
              </div>
              <div>
                <h1 className="text-base font-semibold leading-tight">{t('popup.title')}</h1>
                <p className="truncate text-xs text-muted-foreground">{t('popup.subtitle')}</p>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <label className="relative flex h-8 w-[112px] items-center rounded-md bg-muted px-2 text-xs text-foreground focus-within:ring-2 focus-within:ring-ring">
              <Languages className="mr-1 size-3.5 shrink-0 text-muted-foreground" />
              <select
                value={locale}
                onChange={(event) => void updateLocale(event.target.value as Locale)}
                className="min-w-0 flex-1 appearance-none bg-transparent text-xs outline-none"
                aria-label="Language"
              >
                {Object.entries(localeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <Button variant="quiet" size="icon" onClick={openOptions} title={t('common.settings')}>
              <Settings />
            </Button>
          </div>
        </div>
      </div>

      <div ref={revealRef} className="space-y-3 p-4">
        <section data-reveal className="rounded-lg border bg-card p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <StatusDot ok={Boolean(runtime?.connection.ok)} checking={runtimeLoading} />
                <span className="text-sm font-medium">
                  {runtime?.connection.ok ? t('status.online') : t('status.offline')}
                </span>
                {runtime?.connection.version ? <Badge variant="secondary">aria2 {runtime.connection.version}</Badge> : null}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {runtime?.connection.ok
                  ? t('popup.rpcLatency', { ms: runtime.connection.latencyMs ?? 0 })
                  : t('popup.connectionHint', { port: snapshot.connection.port })}
              </p>
            </div>
            <Button variant="outline" size="sm" disabled={runtimeLoading} onClick={() => void refreshRuntime()}>
              <RefreshCw className={cn(runtimeLoading && 'animate-spin')} />
              {t('common.retry')}
            </Button>
          </div>
        </section>

        <section data-reveal className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border bg-card p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Activity className="size-3.5 text-speed-download" />
              {t('popup.downloadSpeed')}
            </div>
            <div className="metric-font mt-1 text-lg font-semibold text-speed-download">
              {formatSpeed(runtime?.stat?.downloadSpeed)}
            </div>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Activity className="size-3.5 rotate-180 text-speed-upload" />
              {t('popup.uploadSpeed')}
            </div>
            <div className="metric-font mt-1 text-lg font-semibold text-speed-upload">
              {formatSpeed(runtime?.stat?.uploadSpeed)}
            </div>
          </div>
        </section>

        <section data-reveal className="rounded-lg border bg-card p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" />
              <div>
                <div className="text-sm font-medium">{t('popup.interception')}</div>
                <div className="text-xs text-muted-foreground">
                  {snapshot.settings.enabled ? t('popup.captureOn') : t('popup.captureOff')}
                </div>
              </div>
            </div>
            <Switch
              checked={snapshot.settings.enabled}
              onCheckedChange={(checked) => void updateInterception(checked)}
            />
          </div>
        </section>

        <section data-reveal className="rounded-lg border bg-card p-3">
          <div className="flex gap-2">
            <Input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void addTask();
              }}
              placeholder={t('popup.addTaskPlaceholder')}
            />
            <Button disabled={busy || !url.trim()} onClick={() => void addTask()}>
              <Plus />
              {t('common.add')}
            </Button>
          </div>
        </section>

        <section data-reveal className="rounded-lg border bg-card p-3">
          <Tabs defaultValue="active">
            <div className="flex items-center justify-between gap-2">
              <TabsList className="grid flex-1 grid-cols-3">
                <TabsTrigger value="active">
                  {t('common.active')} <span className="ml-1 text-xs text-muted-foreground">{counts.active}</span>
                </TabsTrigger>
                <TabsTrigger value="waiting">
                  {t('common.waiting')} <span className="ml-1 text-xs text-muted-foreground">{counts.waiting}</span>
                </TabsTrigger>
                <TabsTrigger value="stopped">
                  {t('common.stopped')} <span className="ml-1 text-xs text-muted-foreground">{counts.stopped}</span>
                </TabsTrigger>
              </TabsList>
            </div>
            <TaskList
              value="active"
              tasks={runtime?.tasks.active ?? []}
              empty={t('popup.noTasks')}
              onPause={(gid) => void runAction(t('common.pause'), () => sendRuntimeMessage({ type: 'task-action', action: 'pause', gid }))}
              onResume={(gid) => void runAction(t('common.resume'), () => sendRuntimeMessage({ type: 'task-action', action: 'resume', gid }))}
              onRemove={(gid) => void runAction(t('common.remove'), () => sendRuntimeMessage({ type: 'task-action', action: 'remove', gid }))}
            />
            <TaskList
              value="waiting"
              tasks={runtime?.tasks.waiting ?? []}
              empty={t('popup.noTasks')}
              onPause={(gid) => void runAction(t('common.pause'), () => sendRuntimeMessage({ type: 'task-action', action: 'pause', gid }))}
              onResume={(gid) => void runAction(t('common.resume'), () => sendRuntimeMessage({ type: 'task-action', action: 'resume', gid }))}
              onRemove={(gid) => void runAction(t('common.remove'), () => sendRuntimeMessage({ type: 'task-action', action: 'remove', gid }))}
            />
            <TaskList
              value="stopped"
              tasks={runtime?.tasks.stopped ?? []}
              empty={t('popup.noTasks')}
              onPause={(gid) => void runAction(t('common.pause'), () => sendRuntimeMessage({ type: 'task-action', action: 'pause', gid }))}
              onResume={(gid) => void runAction(t('common.resume'), () => sendRuntimeMessage({ type: 'task-action', action: 'resume', gid }))}
              onRemove={(gid) => void runAction(t('common.remove'), () => sendRuntimeMessage({ type: 'task-action', action: 'remove', gid }))}
            />
          </Tabs>
        </section>

        <Separator />

        <div data-reveal className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => void runAction(t('popup.pauseAll'), () => sendRuntimeMessage({ type: 'pause-all' }))}
          >
            <Pause />
            {t('popup.pauseAll')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => void runAction(t('popup.resumeAll'), () => sendRuntimeMessage({ type: 'resume-all' }))}
          >
            <Play />
            {t('popup.resumeAll')}
          </Button>
          <Button
            size="sm"
            onClick={() => void runAction(t('common.openMotrix'), () => sendRuntimeMessage({ type: 'wake-motrix' }))}
          >
            <Power />
            {t('common.openMotrix')}
          </Button>
        </div>
      </div>
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
      <ScrollArea className="h-[238px] pr-2">
        {tasks.length ? (
          <div className="space-y-2">
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
        ) : (
          <div className="flex h-[220px] items-center justify-center rounded-md border border-dashed text-center text-sm text-muted-foreground">
            {empty}
          </div>
        )}
      </ScrollArea>
    </TabsContent>
  );
}
