import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react', '@wxt-dev/i18n/module'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: 'Motrix Extension',
    description: 'Send browser downloads to Motrix and manage aria2 tasks from Chrome',
    version: '1.0.0',
    minimum_chrome_version: '116',
    default_locale: 'en_US',
    action: {
      default_title: 'Motrix',
      default_popup: 'popup.html',
    },
    options_ui: {
      page: 'options.html',
      open_in_tab: true,
    },
    permissions: [
      'downloads',
      'storage',
      'contextMenus',
      'cookies',
      'webRequest',
    ],
    host_permissions: [
      'http://*/*',
      'https://*/*',
    ],
  },
});
