/**
 * Resolve the Postgres connection URL for Drizzle and `@neondatabase/serverless`.
 *
 * Vercel + Neon integration exposes pooled URLs as `NEON_DATABASE_URL` /
 * `NEON_POSTGRES_URL` (and sometimes Prisma-style URLs). Local setups and docs
 * commonly use `DATABASE_URL`.
 *
 * Priority: `DATABASE_URL`, Neon-managed names, then legacy `POSTGRES_*` (some Vercel templates).
 */
export function resolveDatabaseUrl(): string {
  return firstNonEmpty([
    process.env.DATABASE_URL,
    process.env.NEON_DATABASE_URL,
    process.env.NEON_POSTGRES_URL,
    process.env.NEON_POSTGRES_PRISMA_URL,
    process.env.POSTGRES_URL,
    process.env.POSTGRES_PRISMA_URL,
  ]);
}

/**
 * Resolve a direct/unpooled database URL for schema migrations.
 *
 * Vercel-managed Neon exposes `DATABASE_URL` as a pooled PgBouncer URL and
 * `DATABASE_URL_UNPOOLED` as a direct URL. Runtime queries can use pooled URLs,
 * but migrations should prefer the direct connection when one is available.
 */
export function resolveMigrationDatabaseUrl(): string {
  const directUrl = firstNonEmpty([
    process.env.DATABASE_URL_UNPOOLED,
    process.env.DATABASE_URL_NON_POOLING,
    process.env.NEON_DATABASE_URL_UNPOOLED,
    process.env.NEON_POSTGRES_URL_UNPOOLED,
    process.env.POSTGRES_URL_NON_POOLING,
    process.env.POSTGRES_URL_UNPOOLED,
  ]);

  if (directUrl) return directUrl;

  const builtFromPieces = buildUnpooledUrlFromPgEnv();
  if (builtFromPieces) return builtFromPieces;

  return resolveDatabaseUrl();
}

function firstNonEmpty(values: Array<string | undefined>): string {
  for (const raw of values) {
    const trimmed = raw?.trim();
    if (trimmed) return trimmed;
  }
  return '';
}

function buildUnpooledUrlFromPgEnv(): string {
  const host = process.env.PGHOST_UNPOOLED?.trim();
  const user = process.env.PGUSER?.trim();
  const password = process.env.PGPASSWORD?.trim();
  const database = process.env.PGDATABASE?.trim();

  if (!host || !user || !password || !database) return '';

  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(
    password,
  )}@${host}/${encodeURIComponent(database)}?sslmode=require`;
}
