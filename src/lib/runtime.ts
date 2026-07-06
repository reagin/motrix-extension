import type { RuntimeMessage, RuntimeResponse } from '@/src/lib/messages';

export async function sendRuntimeMessage(message: RuntimeMessage): Promise<RuntimeResponse> {
  return browser.runtime.sendMessage(message);
}
