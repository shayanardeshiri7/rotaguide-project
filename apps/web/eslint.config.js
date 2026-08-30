import base from '@rotaguide/config/eslint';
import next from '@next/eslint-plugin-next';

export default [
  { ignores: ['.next/**', 'out/**', 'public/v1/**', 'next-env.d.ts'] },
  ...base,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { '@next/next': next },
    rules: {
      ...next.configs.recommended.rules,
      ...next.configs['core-web-vitals'].rules,
    },
  },
];
