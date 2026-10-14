import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@template/config': path.resolve(
        __dirname,
        '../../packages/config/src/index.ts',
      ),
      '@template/db': path.resolve(__dirname, '../../packages/db/src/index.ts'),
      '@template/auth/server': path.resolve(
        __dirname,
        '../../packages/auth/src/server.ts',
      ),
      '@template/auth': path.resolve(
        __dirname,
        '../../packages/auth/src/index.ts',
      ),
      '@template/i18n/navigation': path.resolve(
        __dirname,
        '../../packages/i18n/src/navigation.ts',
      ),
      '@template/i18n': path.resolve(
        __dirname,
        '../../packages/i18n/src/index.ts',
      ),
      '@template/ui': path.resolve(__dirname, '../../packages/ui/src/index.ts'),
    },
  },
});
