import type { ContextMenuTarget, ContextMenuTargetSource, RuntimeMessage, RuntimeResponse } from '@/library/messages';

const PROTOCOL_PATTERN = /^(?:magnet|ed2k|thunder):/i;
const CONTEXT_MENU_TARGET_TTL_MS = 60000;
const SUPPORTED_PROTOCOLS = new Set(['http:', 'https:', 'magnet:', 'ed2k:', 'thunder:']);
const TEXT_URL_PATTERN = /(https?:\/\/[^\s<>"'`]+|magnet:\?[^\s<>"'`]+|ed2k:\/\/[^\s<>"'`]+|thunder:\/\/[A-Z0-9+/=]+)/i;

interface RecordedContextMenuTarget {
  time: number;
  target: ContextMenuTarget;
}

let lastContextMenuTarget: RecordedContextMenuTarget | undefined;

export default defineContentScript({
  matches: ['http://*/*', 'https://*/*'],
  runAt: 'document_start',
  main() {
    document.addEventListener(
      'contextmenu',
      (event) => {
        lastContextMenuTarget = {
          time: Date.now(),
          target: resolveContextMenuTarget(event),
        };
      },
      true,
    );

    document.addEventListener(
      'click',
      (event) => {
        const target = event.target instanceof Element ? event.target.closest('a[href]') : null;
        if (!(target instanceof HTMLAnchorElement)) return;
        const href = target.href;
        if (!PROTOCOL_PATTERN.test(href)) return;
        event.preventDefault();
        event.stopPropagation();
        void browser.runtime
          .sendMessage({
            type: 'content-protocol-click',
            url: href,
            pageUrl: location.href,
          })
          .then((response: RuntimeResponse) => {
            if (!response.ok && response.code === 'disabled') {
              location.href = href;
            }
          })
          .catch(() => {
            location.href = href;
          });
      },
      true,
    );

    browser.runtime.onMessage.addListener((message: RuntimeMessage) => {
      if (message.type !== 'resolve-context-menu-target') return undefined;
      return Promise.resolve<RuntimeResponse>({
        ok: true,
        contextMenuTarget: getLatestContextMenuTarget(),
      });
    });
  },
});

function getLatestContextMenuTarget(): ContextMenuTarget {
  const recorded = lastContextMenuTarget;
  const isFresh = recorded
    && recorded.target.pageUrl === location.href
    && Date.now() - recorded.time <= CONTEXT_MENU_TARGET_TTL_MS;
  return isFresh ? recorded.target : buildTarget(location.href, 'page');
}

function resolveContextMenuTarget(event: MouseEvent): ContextMenuTarget {
  const element = getElementAtPoint(event);
  const linkUrl = getClosestLinkUrl(element);
  if (linkUrl) return buildTarget(linkUrl, 'link');

  const mediaUrl = getClosestMediaUrl(element);
  if (mediaUrl) return buildTarget(mediaUrl, 'media');

  const selectionUrl = findSupportedTextUrl(globalThis.getSelection()?.toString());
  if (selectionUrl) return buildTarget(selectionUrl, 'selection');

  return buildTarget(location.href, 'page');
}

function getElementAtPoint(event: MouseEvent): Element | undefined {
  const pointElement = document.elementFromPoint(event.clientX, event.clientY);
  if (pointElement instanceof Element) return pointElement;
  return event.target instanceof Element ? event.target : undefined;
}

function getClosestLinkUrl(element: Element | undefined): string | undefined {
  const link = element?.closest('a[href]');
  return link instanceof HTMLAnchorElement ? normalizeSupportedUrl(link.href) : undefined;
}

function getClosestMediaUrl(element: Element | undefined): string | undefined {
  const image = element?.closest('img');
  if (image instanceof HTMLImageElement) return normalizeSupportedUrl(image.currentSrc || image.src);

  const media = element?.closest('video,audio');
  if (media instanceof HTMLMediaElement) return normalizeSupportedUrl(media.currentSrc || media.src);

  const source = element?.closest('source');
  return source instanceof HTMLSourceElement ? normalizeSupportedUrl(source.src) : undefined;
}

function buildTarget(url: string, source: ContextMenuTargetSource): ContextMenuTarget {
  return { url, pageUrl: location.href, source };
}

function findSupportedTextUrl(text: string | undefined): string | undefined {
  const match = text?.match(TEXT_URL_PATTERN)?.[0];
  return normalizeSupportedUrl(match);
}

function normalizeSupportedUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim().replace(/^[<('"“‘]+/, '').replace(/[>)'",.，。；;!！?？]+$/, '');
  return isSupportedUrl(trimmed) ? trimmed : undefined;
}

function isSupportedUrl(value: string): boolean {
  return SUPPORTED_PROTOCOLS.has(getProtocol(value));
}

function getProtocol(value: string): string {
  try {
    return new URL(value).protocol;
  } catch {
    return /^([a-z][a-z0-9+.-]*):/i.exec(value)?.[1]?.toLowerCase().concat(':') ?? '';
  }
}
