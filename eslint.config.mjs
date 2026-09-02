import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import eslintConfigPrettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const tsProjects = [
  './tsconfig.json',
  './apps/webapp/tsconfig.json',
  './examples/*/tsconfig.json',
  './packages/*/tsconfig.json',
  './services/*/tsconfig.json',
];

const sourceFiles = [
  'vitest.config.ts',
  'apps/webapp/next.config.mjs',
  'apps/webapp/src/**/*.{js,jsx,ts,tsx}',
  'examples/*/src/**/*.{js,jsx,ts,tsx}',
  'packages/*/src/**/*.{js,jsx,ts,tsx}',
  'services/*/src/**/*.{js,jsx,ts,tsx}',
  'services/*/instrumentation.ts',
];

const webappSourceFiles = ['apps/webapp/src/**/*.{js,jsx,mjs,ts,tsx,mts,cts}'];

const testGlobals = {
  afterAll: 'readonly',
  afterEach: 'readonly',
  beforeAll: 'readonly',
  beforeEach: 'readonly',
  describe: 'readonly',
  expect: 'readonly',
  it: 'readonly',
  test: 'readonly',
  vi: 'readonly',
};

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/build/**',
      '**/lib/**',
      '**/coverage/**',
      '**/gen/**',
      '**/drizzle/**',
      'ci/secrets/**',
      'local-docs/**',
      '.agents/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: webappSourceFiles,
    plugins: {
      '@next/next': nextPlugin,
    },
    settings: {
      next: {
        rootDir: 'apps/webapp/',
      },
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      '@next/next/no-html-link-for-pages': 'off',
    },
  },
  {
    files: sourceFiles,
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      sourceType: 'module',
    },
    plugins: {
      import: importPlugin,
      'unused-imports': unusedImports,
    },
    settings: {
      'import/resolver': {
        node: true,
        typescript: {
          alwaysTryTypes: true,
          noWarnOnMultipleProjects: true,
          project: tsProjects,
        },
      },
    },
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'import/no-duplicates': 'error',
      'import/order': [
        'warn',
        {
          alphabetize: {
            caseInsensitive: true,
            order: 'asc',
          },
          groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index'], 'object'],
          'newlines-between': 'ignore',
        },
      ],
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          vars: 'all',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    files: ['**/*.{spec,test}.{js,jsx,ts,tsx}', '**/vitest.setup.ts', '**/__tests__/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: testGlobals,
    },
  },
  eslintConfigPrettier,
);
