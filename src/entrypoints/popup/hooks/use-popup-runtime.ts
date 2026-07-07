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
  const runtimeInFlightRef = useRef(false);

  const refreshSnapshot = useCallback(async () => {
    const response = await sendRuntimeMessage({ type: 'settings-snapshot' });
    if (response.ok && response.snapshot) {
      setSnapshot(response.snapshot);
    }
  }, []);

  const refreshRuntime = useCallback(async (quiet = false) => {
    if (runtimeInFlightRef.current) return;
    runtimeInFlightRef.current = true;
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
      if (!quiet) {
        const elapsed = performance.now() - startedAt;
        if (elapsed < CONNECTING_CARD_MIN_MS) {
          await delay(CONNECTING_CARD_MIN_MS - elapsed);
        }
      }
      setRuntime(nextRuntime);
      setStatus(nextStatus);
      setErrorMessage(nextErrorMessage);
      runtimeInFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    void refreshSnapshot();
    void refreshRuntime(false);
  }, [refreshRuntime, refreshSnapshot]);

  return {
    snapshot,
    setSnapshot,
    runtime,
    status,
    errorMessage,
    refreshSnapshot,
    refreshRuntime,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms);
  });
}
