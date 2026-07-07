import type { RuntimeMessage, RuntimeResponse } from '@/library/messages';

export async function sendRuntimeMessage(message: RuntimeMessage): Promise<RuntimeResponse> {
  return browser.runtime.sendMessage(message);
}
