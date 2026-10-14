import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import nextEnv from '@next/env';
import { neon, Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';

const packageDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

// Env files (`.env`, `.env.local`) live in apps/platform, not this package.
const { loadEnvConfig } = nextEnv;
loadEnvConfig(
  path.join(packageDir, '../../apps/platform'),
  process.env.NODE_ENV !== 'production',
);

const MIGRATIONS_DIR = path.join(packageDir, 'drizzle/migrations');

/**
 * Same priority as packages/db/src/resolve-database-url.ts — Vercel Neon
 * often injects NEON_DATABASE_URL without also setting DATABASE_URL.
 */
function resolveDatabaseUrl() {
  for (const key of [
    'DATABASE_URL',
    'NEON_DATABASE_URL',
    'NEON_POSTGRES_URL',
    'NEON_POSTGRES_PRISMA_URL',
    'POSTGRES_URL',
    'POSTGRES_PRISMA_URL',
  ]) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return '';
}

/** Markers for migrations that can be detected in an existing schema. */
const MIGRATION_MARKERS = {
  '0018_crm_email_attachments': {
    table: 'crm_email_messages',
    column: 'attachment_count',
  },
  '0017_scan_share_token': {
    table: 'scans',
    column: 'share_token',
  },
  '0016_crm_email_reply_to_address': {
    table: 'crm_email_messages',
    column: 'reply_to_address',
  },
  '0010_scan_cache_and_ip': {
    table: 'scans',
    column: 'request_ip',
  },
  '0009_scans_scanner_job_id': {
    table: 'scans',
    column: 'scanner_job_id',
  },
  '0002_amusing_barracuda': {
    table: 'scans',
    column: 'scan_progress',
  },
  '0001_funny_micromacro': {
    table: 'scan_pages',
    column: 'page_screenshot_data_url',
  },
  '0026_scans_guest_claim': {
    table: 'scans',
    column: 'guest_claim_token',
  },
  '0027_crm_appointments': {
    table: 'crm_appointment_settings',
    column: 'timezone',
  },
  '0028_appointment_pending_status': {
    table: 'crm_appointment_slots',
    column: 'booked_at',
  },
  '0029_appointment_slot_locale': {
    table: 'crm_appointment_slots',
    column: 'booked_locale',
  },
  '0030_appointment_guest_rsvp': {
    table: 'crm_appointment_slots',
    column: 'guest_rsvp',
  },
  '0031_appointment_booking_limits': {
    table: 'crm_appointment_reschedules',
    column: 'user_id',
  },
};

function readJournalEntries() {
  const journalPath = path.join(MIGRATIONS_DIR, 'meta/_journal.json');
  const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8'));
  return journal.entries;
}

function migrationRecord(entry) {
  const sqlPath = path.join(MIGRATIONS_DIR, `${entry.tag}.sql`);
  const query = fs.readFileSync(sqlPath, 'utf8');
  return {
    tag: entry.tag,
    when: entry.when,
    hash: crypto.createHash('sha256').update(query).digest('hex'),
  };
}

async function columnExists(sql, table, column) {
  const rows = await sql`
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = ${table}
      AND column_name = ${column}
    LIMIT 1
  `;
  return rows.length > 0;
}

async function tableExists(sql, table, schema = 'public') {
  const rows = await sql`
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = ${schema}
      AND table_name = ${table}
    LIMIT 1
  `;
  return rows.length > 0;
}

async function migrationJournalCount(sql) {
  if (!(await tableExists(sql, '__drizzle_migrations', 'drizzle'))) {
    return 0;
  }

  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count FROM drizzle.__drizzle_migrations
  `;
  return count;
}

function describeDatabaseHost(url) {
  try {
    return new URL(url.replace(/^postgres(ql)?:/i, 'https:')).host;
  } catch {
    return '(unparsed)';
  }
}

/** Same DDL drizzle-kit uses before recording applied migrations. */
async function ensureDrizzleMigrationsTable(sql) {
  await sql`CREATE SCHEMA IF NOT EXISTS drizzle`;
  await sql`
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `;
}

async function isMigrationApplied(sql, tag) {
  const marker = MIGRATION_MARKERS[tag];
  if (marker) {
    return columnExists(sql, marker.table, marker.column);
  }
  return null;
}

/**
 * When the DB was created with db:push, __drizzle_migrations is empty and
 * drizzle-kit migrate tries to replay every migration from 0000. Find the latest
 * journal entry that already matches the live schema so only newer SQL runs.
 */
async function resolveBaselineEntry(sql, entries) {
  let lastAppliedIndex = -1;

  for (let i = 0; i < entries.length; i++) {
    const applied = await isMigrationApplied(sql, entries[i].tag);
    if (applied === true) {
      lastAppliedIndex = i;
      continue;
    }
    if (applied === false) {
      break;
    }
  }

  if (lastAppliedIndex >= 0) {
    return entries[lastAppliedIndex];
  }

  if (await tableExists(sql, 'users')) {
    return entries.find((entry) => entry.tag === '0000_init_schema') ?? null;
  }

  return null;
}

async function ensureMigrationBaseline() {
  const url = resolveDatabaseUrl();
  if (!url) {
    console.error(
      'No database URL resolved (DATABASE_URL / NEON_DATABASE_URL / ...); cannot baseline migrations.',
    );
    process.exit(1);
  }

  // drizzle-kit and this baseline step both expect DATABASE_URL when set.
  if (!process.env.DATABASE_URL?.trim()) {
    process.env.DATABASE_URL = url;
  }

  const sql = neon(url);
  const count = await migrationJournalCount(sql);

  if (count > 0) {
    console.log(`Migration journal has ${count} row(s); skipping baseline.`);
    return;
  }

  if (!(await tableExists(sql, 'users'))) {
    console.log('Fresh database detected; running full migration history.');
    return;
  }

  const entries = readJournalEntries();
  const baselineEntry = await resolveBaselineEntry(sql, entries);
  if (!baselineEntry) {
    console.warn(
      'Could not infer an existing schema baseline; drizzle migrate will run from 0000.',
    );
    return;
  }

  const record = migrationRecord(baselineEntry);
  await ensureDrizzleMigrationsTable(sql);
  await sql`
    INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
    VALUES (${record.hash}, ${record.when})
  `;

  console.log(
    `Baselined existing schema at ${baselineEntry.tag}; pending migrations will run next.`,
  );
}

async function ensureGuestScanClaimColumns(sql) {
  if (!(await tableExists(sql, 'scans'))) return;
  if (await columnExists(sql, 'scans', 'guest_claim_token')) return;

  console.warn(
    'scans.guest_claim_token is missing; applying 0026_scans_guest_claim.sql directly.',
  );
  await sql`ALTER TABLE "scans" ALTER COLUMN "user_id" DROP NOT NULL`;
  await sql`ALTER TABLE "scans" ADD COLUMN IF NOT EXISTS "guest_claim_token" text`;
  await sql`ALTER TABLE "scans" ADD COLUMN IF NOT EXISTS "claimed_at" timestamp`;
  await sql`CREATE INDEX IF NOT EXISTS "scans_guest_claim_token_idx" ON "scans" ("guest_claim_token")`;
}

/** Neon allows dropping public; Postgres does not recreate it automatically. */
async function ensurePublicSchema(sql) {
  await sql`CREATE SCHEMA IF NOT EXISTS public`;
}

async function runMigrations() {
  const url = resolveDatabaseUrl();
  if (!url) {
    console.error(
      'No database URL resolved (DATABASE_URL / NEON_DATABASE_URL / ...); cannot migrate.',
    );
    process.exit(1);
  }

  const sql = neon(url);
  await ensurePublicSchema(sql);
  console.log(`Migrating database host: ${describeDatabaseHost(url)}`);

  const pool = new Pool({ connectionString: url, max: 1 });
  const db = drizzle(pool);

  try {
    console.log('Applying migrations…');
    await migrate(db, { migrationsFolder: MIGRATIONS_DIR });
    await ensureGuestScanClaimColumns(sql);
    console.log('Migrations applied successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

process.env.MIGRATE_USE_APP_DATABASE_URL = '1';

await ensureMigrationBaseline();
await runMigrations();
