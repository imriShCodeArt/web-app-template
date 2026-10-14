import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';

import { resolveDatabaseUrl } from './resolve-database-url';
import * as schema from './schema';

/**
 * Neon over WebSockets (Pool) is more reliable with Drizzle than the HTTP `neon()`
 * driver in some environments. `max: 1` suits serverless / per-invocation use.
 * Reuse the pool in dev to avoid exhausting connections on HMR.
 */
const globalForPool = globalThis as typeof globalThis & { neonPool?: Pool };

const connectionString = resolveDatabaseUrl();

if (!connectionString && process.env.NODE_ENV !== 'production') {
  console.warn(
    '[@template/db] No database URL resolved (DATABASE_URL / NEON_DATABASE_URL / ...); DB calls will fail.',
  );
}

const pool =
  globalForPool.neonPool ??
  new Pool({
    connectionString,
    max: 1,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPool.neonPool = pool;
}

export const db = drizzle(pool, { schema });
