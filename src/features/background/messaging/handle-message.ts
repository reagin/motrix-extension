import type { RuntimeMessage, RuntimeResponse } from '@/library/messages';

import { Aria2RpcClient } from '@/library/rpc';
import { wakeMotrix } from '@/library/protocol/launcher';
import { routeUrl } from '@/features/background/protocol/route-url';
import { buildPopupState, buildRuntimeState } from '@/features/background/runtime-state/build-runtime-state';
import {
  appendDiagnostic,
  clearDiagnostics,
  DEFAULT_STORAGE,
  loadSnapshot,
  saveSiteRules,
  saveSnapshot,
  updateConnection,
  updateSettings,
  updateUi,
} from '@/library/storage';

import { clearTasks, performTaskAction, withClient } from './task-actions';

export async function handleMessage(message: RuntimeMessage): Promise<RuntimeResponse> {
  try {
    switch (message.type) {
      case 'popup-state':
        return { ok: true, state: await buildPopupState() };
      case 'runtime-state':
        return { ok: true, runtime: await buildRuntimeState(await loadSnapshot()) };
      case 'settings-snapshot':
        return { ok: true, snapshot: await loadSnapshot() };
      case 'test-connection': {
        const snapshot = await loadSnapshot();
        const client = new Aria2RpcClient(message.connection ?? snapshot.connection);
        return { ok: true, result: await client.checkConnection() };
      }
      case 'update-settings':
        return { ok: true, snapshot: await updateSettings(message.patch) };
      case 'update-connection':
        return { ok: true, snapshot: await updateConnection(message.patch) };
      case 'update-ui':
        return { ok: true, snapshot: await updateUi(message.patch) };
      case 'save-site-rules':
        return { ok: true, snapshot: await saveSiteRules(message.siteRules) };
      case 'add-url':
        return await routeUrl(message.url, '', 'manual_popup');
      case 'task-action':
        await performTaskAction(message.action, message.gid, message.status);
        return { ok: true };
      case 'pause-all':
        await withClient((client) => client.pauseAll());
        return { ok: true };
      case 'resume-all':
        await withClient((client) => client.resumeAll());
        return { ok: true };
      case 'clear-tasks':
        await clearTasks(message.lane, message.gids);
        return { ok: true };
      case 'wake-motrix':
        await wakeMotrix();
        return { ok: true };
      case 'content-protocol-click':
        return await routeUrl(message.url, message.pageUrl, 'content_protocol');
      case 'append-diagnostic':
        await appendDiagnostic(message.event);
        return { ok: true };
      case 'clear-diagnostics':
        return { ok: true, snapshot: await clearDiagnostics() };
      case 'restore-defaults':
        await saveSnapshot(DEFAULT_STORAGE);
        return { ok: true, snapshot: DEFAULT_STORAGE };
      case 'replace-snapshot':
        await saveSnapshot(message.snapshot);
        return { ok: true, snapshot: message.snapshot };
      default:
        return { ok: false, code: 'unknown_message', message: 'Unknown message' };
    }
  } catch (error) {
    return {
      ok: false,
      code: error instanceof Error ? error.name : 'error',
      message: error instanceof Error ? error.message : String(error),
    };
  }
}
