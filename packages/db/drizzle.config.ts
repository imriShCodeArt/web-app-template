import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadEnvConfig } from '@next/env';
import { defineConfig } from 'drizzle-kit';

import {
  resolveDatabaseUrl,
  resolveMigrationDatabaseUrl,
} from './src/resolve-database-url';

// Env files (`.env`, `.env.local`) live in apps/platform, not this package —
// load from there so migrations target the same DB as `next dev`.
const platformDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../apps/platform',
);
loadEnvConfig(platformDir, process.env.NODE_ENV !== 'production');

/**
 * - Local / non-production: use the **same** URL as `serverEnv` / `next dev` so `db:migrate` and
 *   `db:push` cannot silently target `DATABASE_URL_UNPOOLED` while the app uses the pooled URL.
 * - Production (e.g. Vercel `yarn vercel-build`): prefer the direct / unpooled migration URL when set.
 */
function drizzleConnectionUrl(): string {
  if (process.env.MIGRATE_USE_APP_DATABASE_URL === '1') {
    return resolveDatabaseUrl();
  }
  if (process.env.NODE_ENV !== 'production') {
    return resolveDatabaseUrl();
  }
  return resolveMigrationDatabaseUrl();
}

export default defineConfig({
  schema: './src/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: drizzleConnectionUrl(),
  },
  verbose: true,
  strict: true,
});
