import type { RuntimeMessage } from '@/library/messages';
import type { DownloadItem } from '@/features/background/downloads/types';

import { handleMessage } from '@/features/background/messaging/handle-message';
import { ensureContextMenu, handleContextMenuClick } from '@/features/background/context-menu';
import { handleDownloadCreated } from '@/features/background/downloads/handle-download-created';
import { captureRequestHeaders, captureResponseHeaders } from '@/features/background/downloads/request-capture';

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(() => {
    void ensureContextMenu();
  });

  browser.runtime.onStartup.addListener(() => {
    void ensureContextMenu();
  });

  browser.contextMenus.onClicked.addListener(handleContextMenuClick);

  browser.downloads.onCreated.addListener((item) => {
    void handleDownloadCreated(item as DownloadItem);
  });

  browser.webRequest.onBeforeSendHeaders.addListener(
    (details) => {
      captureRequestHeaders(details);
      return undefined;
    },
    { urls: ['http://*/*', 'https://*/*'] },
    ['requestHeaders', 'extraHeaders'],
  );

  browser.webRequest.onHeadersReceived.addListener(
    (details) => {
      captureResponseHeaders(details);
      return undefined;
    },
    { urls: ['http://*/*', 'https://*/*'] },
    ['responseHeaders', 'extraHeaders'],
  );

  browser.runtime.onMessage.addListener((message: RuntimeMessage) => handleMessage(message));
});
