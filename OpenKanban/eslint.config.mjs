import nextConfig from 'eslint-config-next';
import importPlugin from 'eslint-plugin-import';

export default [
  ...nextConfig,
  {
    plugins: {
      import: importPlugin
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-console': 'warn',
      'import/no-default-export': 'error'
    }
  },
  // Override: Allow default exports in Next.js special files
  {
    files: [
      '**/page.tsx',
      '**/layout.tsx',
      '**/loading.tsx',
      '**/not-found.tsx',
      '**/error.tsx'
    ],
    rules: {
      'import/no-default-export': 'off'
    }
  }
];
