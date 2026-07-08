import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { Aria2TaskStatus } from '@/library/rpc';
import type { RuntimeState } from '@/library/messages';
import type { DiagnosticEvent } from '@/library/storage';

import { useI18n } from '@/hooks/use-i18n';
import { useTheme } from '@/hooks/use-theme';
import { sendRuntimeMessage } from '@/library/runtime';
import { useAnimeReveal } from '@/hooks/use-anime-reveal';
import { triggerMotrixProtocol } from '@/library/protocol/launcher';

import type { TaskLane } from './types';

import { TaskPanel } from './components/TaskPanel';
import { PopupHeader } from './components/PopupHeader';
import { MetricsPanel } from './components/MetricsPanel';
import { PopupActions } from './components/PopupActions';
import { usePopupRuntime } from './hooks/use-popup-runtime';
import { ConnectingPanel, OfflinePanel } from './components/ConnectionPanel';

const REFRESH_MS = 5000;

type PopupView = 'initializing' | 'connecting' | 'offline' | 'main';

export default function App() {
  const {
    snapshot,
    setSnapshot,
    runtime,
    setRuntime,
    status,
    errorMessage,
    isInitializing,
    refreshRuntime,
  } = usePopupRuntime();
  const hasSessionVerifiedConnectionRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [activeLane, setActiveLane] = useState<TaskLane>('active');
  const { t } = useI18n(snapshot.ui.locale);
  useTheme(snapshot.ui);

  const isRuntimeConnected = runtime?.connection.ok === true;
  if (isRuntimeConnected) hasSessionVerifiedConnectionRef.current = true;

  const hasStoredVerifiedConnection = snapshot.connection.verifiedAt > 0;
  const canShowConnectedContent = isRuntimeConnected
    || hasStoredVerifiedConnection
    || hasSessionVerifiedConnectionRef.current;
  const fallbackRuntime = useMemo(
    () => (canShowConnectedContent ? buildFallbackRuntime(status, errorMessage) : null),
    [canShowConnectedContent, errorMessage, status],
  );
  const visibleRuntime = runtime ?? fallbackRuntime;
  const activeLaneTaskCount = visibleRuntime?.tasks[activeLane].length ?? 0;
  const popupView: PopupView = visibleRuntime
    ? 'main'
    : isInitializing
      ? 'initializing'
      : status === 'connecting'
        ? 'connecting'
        : 'offline';

  const shouldRevealConnectedContent = snapshot.ui.motion && isRuntimeConnected && !hasStoredVerifiedConnection;
  const revealRef = useAnimeReveal<HTMLDivElement>(
    shouldRevealConnectedContent,
    'connected-content',
  );

  const pollRuntime = useCallback(() => {
    void refreshRuntime(true);
  }, [refreshRuntime]);
  usePopupPolling(pollRuntime);

  const updateInterception = useCallback(async (enabled: boolean) => {
    setSnapshot((current) => ({
      ...current,
      settings: { ...current.settings, enabled },
    }));
    const response = await sendRuntimeMessage({ type: 'update-settings', patch: { enabled } });
    if (response.ok && response.snapshot) {
      setSnapshot(response.snapshot);
    }
  }, [setSnapshot]);

  const recordPopupDiagnostic = useCallback(async (
    level: DiagnosticEvent['level'],
    code: string,
    message: string,
    context?: Record<string, unknown>,
  ) => {
    await sendRuntimeMessage({
      type: 'append-diagnostic',
      event: context ? { level, code, message, context } : { level, code, message },
    }).catch(() => undefined);
  }, []);

  const runAction = useCallback(async (label: string, action: () => Promise<unknown>) => {
    setBusy(true);
    try {
      const response = await action();
      if (isRuntimeError(response)) throw new Error(response.message);
      await refreshRuntime(true);
      await recordPopupDiagnostic('info', 'popup_action_completed', `Popup action completed: ${label}`, { action: label });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await refreshRuntime(true);
      await recordPopupDiagnostic('warn', 'popup_action_failed', `Popup action failed: ${label}`, { action: label, error: message });
    } finally {
      setBusy(false);
    }
  }, [recordPopupDiagnostic, refreshRuntime]);

  const openOptions = useCallback(() => {
    void browser.runtime.openOptionsPage();
  }, []);

  const pauseTask = useCallback((gid: string) => {
    void runAction(t('common.pause'), () => sendRuntimeMessage({ type: 'task-action', action: 'pause', gid }));
  }, [runAction, t]);

  const resumeTask = useCallback((gid: string) => {
    void runAction(t('common.resume'), () => sendRuntimeMessage({ type: 'task-action', action: 'resume', gid }));
  }, [runAction, t]);

  const removeTask = useCallback((gid: string, status: Aria2TaskStatus) => {
    void runAction(t('common.remove'), () => sendRuntimeMessage({ type: 'task-action', action: 'remove', gid, status }));
  }, [runAction, t]);

  const clearActiveLane = useCallback(() => {
    const gids = runtime?.tasks[activeLane].map((task) => task.gid) ?? [];
    void runAction(t('popup.clearAll'), () => sendRuntimeMessage({ type: 'clear-tasks', lane: activeLane, gids }));
  }, [activeLane, runAction, runtime, t]);

  const pauseActiveTasks = useCallback(() => {
    const activeTasks = runtime?.tasks.active ?? [];
    const gids = activeTasks.map((task) => task.gid);
    if (!gids.length) return;

    const gidSet = new Set(gids);
    setRuntime((current) => {
      if (!current) return current;
      const pausedTasks = current.tasks.active
        .filter((task) => gidSet.has(task.gid))
        .map((task) => ({
          ...task,
          status: 'paused' as const,
          downloadSpeed: '0',
          uploadSpeed: '0',
        }));
      if (!pausedTasks.length) return current;
      return {
        ...current,
        tasks: {
          ...current.tasks,
          active: current.tasks.active.filter((task) => !gidSet.has(task.gid)),
          waiting: [...pausedTasks, ...current.tasks.waiting],
        },
      };
    });

    void runAction(t('popup.pauseAll'), () => sendRuntimeMessage({ type: 'pause-all', gids }));
  }, [runAction, runtime, setRuntime, t]);

  const openMotrix = useCallback(() => {
    const actionLabel = t('common.openMotrix');
    try {
      triggerMotrixProtocol();
      void recordPopupDiagnostic('info', 'popup_action_completed', `Popup action completed: ${actionLabel}`, {
        action: actionLabel,
        launch: 'direct_protocol',
      });
    } catch {
      void runAction(actionLabel, () => sendRuntimeMessage({ type: 'wake-motrix' }));
    }
  }, [recordPopupDiagnostic, runAction, t]);

  return (
    <div className='popup-shell w-[380px] overflow-hidden bg-(--m3-surface) text-foreground select-none'>
      <PopupHeader
        snapshot={snapshot}
        status={status}
        version={runtime?.connection.version}
        onToggleCapture={(enabled) => void updateInterception(enabled)}
        onRefresh={() => void refreshRuntime(false)}
        onOpenOptions={openOptions}
        t={t}
      />

      {popupView === 'connecting'
        ? (
            <ConnectingPanel port={snapshot.connection.port} t={t} />
          )
        : popupView === 'offline'
          ? (
              <OfflinePanel
                port={snapshot.connection.port}
                errorMessage={errorMessage}
                t={t}
              />
            )
          : visibleRuntime
            ? (
                <div ref={revealRef}>
                  <MetricsPanel runtime={visibleRuntime} captureEnabled={snapshot.settings.enabled} t={t} />
                  <TaskPanel
                    activeLane={activeLane}
                    runtime={visibleRuntime}
                    onLaneChange={setActiveLane}
                    onPause={pauseTask}
                    onResume={resumeTask}
                    onRemove={removeTask}
                    t={t}
                  />
                  <PopupActions
                    activeLane={activeLane}
                    busy={busy}
                    taskCount={activeLaneTaskCount}
                    onClearAll={clearActiveLane}
                    onPauseAll={pauseActiveTasks}
                    onResumeAll={() => void runAction(t('popup.resumeAll'), () => sendRuntimeMessage({ type: 'resume-all' }))}
                    onWakeMotrix={openMotrix}
                    t={t}
                  />
                </div>
              )
            : null}
    </div>
  );
}

function usePopupPolling(callback: () => void) {
  useEffect(() => {
    const timer = globalThis.setInterval(callback, REFRESH_MS);
    return () => globalThis.clearInterval(timer);
  }, [callback]);
}

function isRuntimeError(value: unknown): value is { ok: false; message: string } {
  return typeof value === 'object' && value !== null && 'ok' in value && value.ok === false;
}

function buildFallbackRuntime(status: 'connecting' | 'connected' | 'offline', message: string): RuntimeState {
  return {
    connection: {
      ok: status === 'connected',
      message,
      checkedAt: Date.now(),
    },
    tasks: { active: [], waiting: [], stopped: [] },
  };
}
