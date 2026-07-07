import type { RuntimeResponse } from '@/library/messages';

const PROTOCOL_PATTERN = /^(?:magnet|ed2k|thunder):/i;

export default defineContentScript({
  matches: ['http://*/*', 'https://*/*'],
  runAt: 'document_start',
  main() {
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
  },
});
