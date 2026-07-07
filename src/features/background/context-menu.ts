import { routeUrl } from './protocol/route-url';

export async function ensureContextMenu(): Promise<void> {
  await browser.contextMenus.removeAll();
  await browser.contextMenus.create({
    id: 'download-with-motrix',
    title: 'Download with Motrix',
    contexts: ['link', 'image', 'audio', 'video', 'page', 'selection'],
  });
}

export function handleContextMenuClick(info: Browser.contextMenus.OnClickData): void {
  const url = info.linkUrl || info.srcUrl || info.pageUrl || info.selectionText;
  if (!url) return;
  void routeUrl(url, info.pageUrl || '', 'context_menu');
}
