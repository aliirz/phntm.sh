import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/__tests__/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/__tests__/**',
        'src/**/layout.tsx',
        'src/**/loading.tsx',
        'src/**/error.tsx',
      ],
    },
    environmentMatchGlobs: [
      ['src/__tests__/lib/encryption.test.ts', 'node'],
      ['src/__tests__/api/**', 'node'],
    ],
  },
});
