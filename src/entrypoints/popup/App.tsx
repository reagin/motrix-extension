import { useCallback, useEffect, useRef, useState } from 'react';

import type { Aria2TaskStatus } from '@/library/rpc';
import type { RuntimeState } from '@/library/messages';
import type { DiagnosticEvent } from '@/library/storage';

import { useI18n } from '@/hooks/use-i18n';
import { useTheme } from '@/hooks/use-theme';
import { sendRuntimeMessage } from '@/library/runtime';
import { useAnimeReveal } from '@/hooks/use-anime-reveal';

import type { TaskLane } from './types';

import { TaskPanel } from './components/TaskPanel';
import { PopupHeader } from './components/PopupHeader';
import { MetricsPanel } from './components/MetricsPanel';
import { PopupActions } from './components/PopupActions';
import { usePopupRuntime } from './hooks/use-popup-runtime';
import { ConnectingPanel, OfflinePanel } from './components/ConnectionPanel';

const REFRESH_MS = 5000;

export default function App() {
  const {
    snapshot,
    setSnapshot,
    runtime,
    status,
    errorMessage,
    refreshRuntime,
  } = usePopupRuntime();
  const hasSessionVerifiedConnectionRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [activeLane, setActiveLane] = useState<TaskLane>('active');
  const { t } = useI18n(snapshot.ui.locale);
  useTheme(snapshot.ui);

  if (runtime?.connection.ok) hasSessionVerifiedConnectionRef.current = true;

  const hasVerifiedConnection = snapshot.connection.verifiedAt > 0 || hasSessionVerifiedConnectionRef.current;
  const visibleRuntime = runtime ?? (hasVerifiedConnection ? buildFallbackRuntime(status, errorMessage) : null);
  const activeLaneTaskCount = visibleRuntime?.tasks[activeLane].length ?? 0;

  const shouldRevealConnectedContent = snapshot.ui.motion && status === 'connected';
  const revealRef = useAnimeReveal<HTMLDivElement>(
    shouldRevealConnectedContent,
    status,
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

      {!hasVerifiedConnection && status === 'connecting'
        ? (
            <ConnectingPanel port={snapshot.connection.port} t={t} />
          )
        : !hasVerifiedConnection && (status === 'offline' || !visibleRuntime)
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
                      onPauseAll={() => void runAction(t('popup.pauseAll'), () => sendRuntimeMessage({ type: 'pause-all' }))}
                      onResumeAll={() => void runAction(t('popup.resumeAll'), () => sendRuntimeMessage({ type: 'resume-all' }))}
                      onWakeMotrix={() => void runAction(t('common.openMotrix'), () => sendRuntimeMessage({ type: 'wake-motrix' }))}
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
