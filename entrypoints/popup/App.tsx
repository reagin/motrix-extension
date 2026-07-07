import { useCallback, useEffect, useState } from 'react';

import type { DiagnosticEvent } from '@/src/lib/storage';

import { useI18n } from '@/src/hooks/use-i18n';
import { useTheme } from '@/src/hooks/use-theme';
import { sendRuntimeMessage } from '@/src/lib/runtime';
import { useAnimeReveal } from '@/src/hooks/use-anime-reveal';

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
  const [busy, setBusy] = useState(false);
  const { t } = useI18n(snapshot.ui.locale);
  useTheme(snapshot.ui);

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

  const removeTask = useCallback((gid: string) => {
    void runAction(t('common.remove'), () => sendRuntimeMessage({ type: 'task-action', action: 'remove', gid }));
  }, [runAction, t]);

  return (
    <div className='popup-shell w-[380px] select-none overflow-hidden bg-(--m3-surface) text-foreground'>
      <PopupHeader
        snapshot={snapshot}
        status={status}
        version={runtime?.connection.version}
        onToggleCapture={(enabled) => void updateInterception(enabled)}
        onRefresh={() => void refreshRuntime(false)}
        onOpenOptions={openOptions}
        t={t}
      />

      {status === 'connecting'
        ? (
            <ConnectingPanel port={snapshot.connection.port} t={t} />
          )
        : status === 'offline' || !runtime
          ? (
              <OfflinePanel
                port={snapshot.connection.port}
                errorMessage={errorMessage}
                t={t}
              />
            )
          : (
              <div ref={revealRef}>
                <MetricsPanel runtime={runtime} captureEnabled={snapshot.settings.enabled} t={t} />
                <TaskPanel
                  runtime={runtime}
                  onPause={pauseTask}
                  onResume={resumeTask}
                  onRemove={removeTask}
                  t={t}
                />
                <PopupActions
                  busy={busy}
                  onPauseAll={() => void runAction(t('popup.pauseAll'), () => sendRuntimeMessage({ type: 'pause-all' }))}
                  onResumeAll={() => void runAction(t('popup.resumeAll'), () => sendRuntimeMessage({ type: 'resume-all' }))}
                  onWakeMotrix={() => void runAction(t('common.openMotrix'), () => sendRuntimeMessage({ type: 'wake-motrix' }))}
                  t={t}
                />
              </div>
            )}
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
