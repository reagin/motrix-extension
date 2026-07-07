import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

const CHROME_VERSION_PART_MAX = 65535;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function padDatePart(value: number): string {
  return value.toString().padStart(2, '0');
}

function getDayBuildNumber(date: Date): number {
  const elapsedMs = date.getHours() * 3600000
    + date.getMinutes() * 60000
    + date.getSeconds() * 1000
    + date.getMilliseconds();

  return Math.floor(elapsedMs * CHROME_VERSION_PART_MAX / (MS_PER_DAY - 1));
}

function getDateVersions(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const buildNumber = getDayBuildNumber(date);
  const displayVersion = [
    year,
    padDatePart(month),
    padDatePart(day),
    buildNumber,
  ].join('.');

  return {
    displayVersion,
    manifestVersion: `${year}.${month}.${day}.${buildNumber}`,
  };
}

const dateVersions = getDateVersions();

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  publicDir: 'src/public',
  modules: ['@wxt-dev/module-react', '@wxt-dev/i18n/module'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  zip: {
    artifactTemplate: '{{name}}-{{version}}-{{browser}}-mv3.zip',
  },
  manifest: {
    name: 'Motrix Extension',
    description: 'Send browser downloads to Motrix and manage aria2 tasks from Chrome',
    version: dateVersions.manifestVersion,
    version_name: dateVersions.displayVersion,
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
