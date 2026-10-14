import { z } from 'zod';

import { resolveDatabaseUrl } from '@template/db';

/**
 * Server-only environment variables. Import this ONLY in server-side files
 * (API routes, server components, lib/auth.ts, lib/db/client.ts).
 * Never import this in shared modules that are bundled for the client.
 */

const schema = z.object({
  DATABASE_URL: z.string().min(1, 'A database URL is required'),
  AUTH_SECRET: z.string().min(1, 'AUTH_SECRET is required'),
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  CONTACT_FROM_EMAIL: z.string().optional(),
  CONTACT_TO_EMAIL: z.string().optional(),
  VERIFICATION_FROM_EMAIL: z.string().optional(),
});

export type ServerEnv = z.infer<typeof schema>;

/** Next.js sets this while collecting page data / compiling the production bundle. */
function isNextProductionBuild(): boolean {
  return process.env.NEXT_PHASE === 'phase-production-build';
}

function buildPlaceholderEnv(): ServerEnv {
  const databaseUrl =
    resolveDatabaseUrl() ||
    'postgresql://build:build@127.0.0.1:5432/build?sslmode=disable';

  return {
    DATABASE_URL: databaseUrl,
    AUTH_SECRET: 'build-time-placeholder-auth-secret',
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    CONTACT_FROM_EMAIL: process.env.CONTACT_FROM_EMAIL,
    CONTACT_TO_EMAIL: process.env.CONTACT_TO_EMAIL,
    VERIFICATION_FROM_EMAIL: process.env.VERIFICATION_FROM_EMAIL,
  };
}

function resolveServerEnv(): ServerEnv {
  const parsed = schema.safeParse({
    DATABASE_URL: resolveDatabaseUrl(),
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    CONTACT_FROM_EMAIL: process.env.CONTACT_FROM_EMAIL,
    CONTACT_TO_EMAIL: process.env.CONTACT_TO_EMAIL,
    VERIFICATION_FROM_EMAIL: process.env.VERIFICATION_FROM_EMAIL,
  });

  if (parsed.success) {
    return parsed.data;
  }

  if (isNextProductionBuild()) {
    console.warn(
      '[env] Server environment validation skipped during build. Configure AUTH_SECRET (and database URL if needed) for Preview/Production runtime on Vercel.',
    );
    return buildPlaceholderEnv();
  }

  console.error(
    'Invalid server environment variables:',
    parsed.error.flatten().fieldErrors,
  );
  throw new Error(
    'Invalid server environment variables. Set NEON_DATABASE_URL or NEON_POSTGRES_URL (Vercel + Neon), or DATABASE_URL locally, plus AUTH_SECRET.',
  );
}

/** `host/db` identity for comparing connection strings (not secrets). */
function postgresUrlIdentity(raw: string): string {
  const t = raw.trim();
  const m = t.match(/^postgres(?:ql)?:\/\/(?:[^@]+@)?([^/?]+)\/([^?]+)/i);
  if (!m) return t.slice(0, 48);
  return `${m[1]}/${decodeURIComponent(m[2])}`;
}

if (process.env.NODE_ENV !== 'production') {
  const du = process.env.DATABASE_URL?.trim();
  const nu = process.env.NEON_DATABASE_URL?.trim();
  if (du && nu && postgresUrlIdentity(du) !== postgresUrlIdentity(nu)) {
    console.warn(
      '[env] DATABASE_URL and NEON_DATABASE_URL are both set but point at different databases. The app uses DATABASE_URL first (see packages/db/src/resolve-database-url.ts). Remove or update DATABASE_URL in .env, or set DATABASE_URL in .env.local to your Neon URL so yarn db:push targets the same DB as yarn dev.',
    );
  }
}

export const serverEnv = resolveServerEnv();
