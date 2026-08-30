import base from '@rotaguide/config/eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  ...base,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  {
    // The domain layer is framework-free by contract. Nothing in it may
    // reach for the DOM, React, or any browser global.
    files: ['src/domain/**/*.ts'],
    rules: {
      'no-restricted-globals': [
        'error',
        'window',
        'document',
        'localStorage',
        'indexedDB',
        'navigator',
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: ['react', 'react-dom', 'zustand', '@/store/*', '@/features/*'],
        },
      ],
    },
  },
];
