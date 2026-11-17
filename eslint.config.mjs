import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import { fileURLToPath } from 'node:url';

export default tseslint.config(
  { ignores: ['node_modules/**', 'playwright-report/**', 'test-results/**', 'data/**', 'security/rules/*.js'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.mjs', '**/*.ts'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['app/client.js'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['**/*.ts'],
    languageOptions: { parserOptions: {
      projectService: true,
      tsconfigRootDir: fileURLToPath(new URL('.', import.meta.url)),
    } },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      // Playwright fixtures can intentionally declare an empty dependency object.
      'no-empty-pattern': ['error', { allowObjectPatternsAsParameters: true }],
    },
  },
  { rules: { 'no-eval': 'error', 'no-new-func': 'error' } },
);
