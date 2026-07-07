import antfu from '@antfu/eslint-config';
import eslintPerfectionist from 'eslint-plugin-perfectionist';
import eslintBetterTailwindcss from 'eslint-plugin-better-tailwindcss';

export default antfu(
  {
    react: true,
    typescript: true,
    formatters: true,
    stylistic: { indent: 2, quotes: 'single', semi: true },
    ignores: ['**/*.md', '*.json', '**/components/ui/*', '.wxt/**', '.output/**'],
  },
  {
    rules: {
      'no-console': 'off',
      'yaml/sort-keys': 'off',
      'antfu/if-newline': 'off',
      'antfu/consistent-list-newline': 'off',
      'style/arrow-parens': 'off',
      'style/brace-style': ['error', '1tbs'],
      'style/jsx-quotes': ['error', 'prefer-single'],
      'style/jsx-first-prop-new-line': 'off',
      'style/jsx-max-props-per-line': 'off',
      'style/jsx-curly-newline': 'off',
      'style/jsx-closing-bracket-location': 'off',
      'style/nonblock-statement-body-position': ['error', 'beside'],
      'style/max-len': ['error', { code: 120, ignoreUrls: true, ignoreStrings: true, ignoreTemplateLiterals: true }],
      'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],
    },
  },
  {
    files: ['**/*.{js,cjs,mjs,jsx,ts,mts,cts,tsx,vue,svelte,astro}'],
    plugins: {
      perfectionist: eslintPerfectionist,
    },
    extends: [eslintBetterTailwindcss.configs.recommended],
    rules: {
      'better-tailwindcss/enforce-consistent-line-wrapping': ['error', { printWidth: 0, preferSingleLine: true }],
      'better-tailwindcss/enforce-consistent-important-position': ['error', { position: 'recommended' }],
      'better-tailwindcss/no-unknown-classes': ['error', { ignore: ['^metric-font$', '^rpc-handshake-track$', '^popup-shell$'] }],
      'perfectionist/sort-enums': ['error', { type: 'line-length', order: 'asc', locales: 'zh-CN', fallbackSort: { type: 'alphabetical', order: 'asc' } }],
      'perfectionist/sort-imports': ['error', { type: 'line-length', order: 'asc', locales: 'zh-CN', fallbackSort: { type: 'alphabetical', order: 'asc' } }],
      'perfectionist/sort-exports': ['error', { type: 'line-length', order: 'desc', locales: 'zh-CN', fallbackSort: { type: 'alphabetical', order: 'desc' } }],
      'perfectionist/sort-interfaces': ['error', { type: 'line-length', order: 'asc', locales: 'zh-CN', fallbackSort: { type: 'alphabetical', order: 'asc' } }],
    },
    settings: {
      'better-tailwindcss': {
        entryPoint: 'src/styles/globals.css',
      },
    },
  },
);
