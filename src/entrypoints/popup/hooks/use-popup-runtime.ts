import { useCallback, useEffect, useRef, useState } from 'react';

import type { RuntimeState } from '@/library/messages';

import { sendRuntimeMessage } from '@/library/runtime';
import { DEFAULT_STORAGE, type StorageSnapshot } from '@/library/storage';

import type { PopupStatus } from '../types';

const CONNECTING_CARD_MIN_MS = 820;

export function usePopupRuntime() {
  const [snapshot, setSnapshot] = useState<StorageSnapshot>(DEFAULT_STORAGE);
  const [runtime, setRuntime] = useState<RuntimeState | null>(null);
  const [status, setStatus] = useState<PopupStatus>('connecting');
  const [errorMessage, setErrorMessage] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  const runtimeInFlightRef = useRef<Promise<void> | null>(null);

  const refreshSnapshot = useCallback(async () => {
    const response = await sendRuntimeMessage({ type: 'settings-snapshot' });
    if (response.ok && response.snapshot) {
      setSnapshot(response.snapshot);
    }
  }, []);

  const runRuntimeRefresh = useCallback(async (quiet: boolean, holdConnectingCard: boolean) => {
    const startedAt = performance.now();
    let nextRuntime: RuntimeState | null = null;
    let nextStatus: PopupStatus = 'offline';
    let nextErrorMessage = '';

    if (!quiet) {
      setStatus('connecting');
      setErrorMessage('');
    }

    try {
      const response = await sendRuntimeMessage({ type: 'runtime-state' });
      if (response.ok && response.runtime) {
        nextRuntime = response.runtime;
        nextStatus = response.runtime.connection.ok ? 'connected' : 'offline';
        nextErrorMessage = response.runtime.connection.ok ? '' : response.runtime.connection.message;
      } else {
        nextRuntime = null;
        nextStatus = 'offline';
        nextErrorMessage = response.ok ? '' : response.message;
      }
    } catch (error) {
      nextRuntime = null;
      nextStatus = 'offline';
      nextErrorMessage = error instanceof Error ? error.message : String(error);
    } finally {
      if (holdConnectingCard) {
        const elapsed = performance.now() - startedAt;
        if (elapsed < CONNECTING_CARD_MIN_MS) {
          await delay(CONNECTING_CARD_MIN_MS - elapsed);
        }
      }
      setRuntime(nextRuntime);
      setStatus(nextStatus);
      setErrorMessage(nextErrorMessage);
    }
  }, []);

  const refreshRuntime = useCallback(async (quiet = false) => {
    while (runtimeInFlightRef.current) {
      await runtimeInFlightRef.current;
      if (!quiet) return;
    }

    const shouldHoldConnectingCard = !quiet && snapshot.connection.verifiedAt <= 0;
    const request = runRuntimeRefresh(quiet, shouldHoldConnectingCard);
    runtimeInFlightRef.current = request;
    try {
      await request;
    } finally {
      if (runtimeInFlightRef.current === request) {
        runtimeInFlightRef.current = null;
      }
    }
  }, [runRuntimeRefresh, snapshot.connection.verifiedAt]);

  const refreshInitialState = useCallback(async () => {
    if (runtimeInFlightRef.current) return;

    setIsInitializing(true);
    setStatus('connecting');
    setErrorMessage('');

    const request = (async () => {
      try {
        const response = await sendRuntimeMessage({ type: 'settings-snapshot' });
        if (response.ok && response.snapshot) {
          setSnapshot(response.snapshot);
          setIsInitializing(false);
          await runRuntimeRefresh(false, response.snapshot.connection.verifiedAt <= 0);
          return;
        }

        throw new Error(response.ok ? 'Unable to read settings snapshot' : response.message);
      } catch (error) {
        const nextErrorMessage = error instanceof Error ? error.message : String(error);
        setRuntime(null);
        setStatus('offline');
        setErrorMessage(nextErrorMessage);
        setIsInitializing(false);
      }
    })();

    runtimeInFlightRef.current = request;
    try {
      await request;
    } finally {
      if (runtimeInFlightRef.current === request) {
        runtimeInFlightRef.current = null;
      }
    }
  }, [runRuntimeRefresh]);

  useEffect(() => {
    void refreshInitialState();
  }, [refreshInitialState]);

  return {
    snapshot,
    setSnapshot,
    runtime,
    setRuntime,
    status,
    errorMessage,
    isInitializing,
    refreshSnapshot,
    refreshRuntime,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms);
  });
}
