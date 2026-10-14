import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { consumeOAuthAuthOutcome } from '@/lib/auth/consumeOAuthAuthOutcome';
import { resetAnalyticsPageContextSession } from '@/lib/tracking/analyticsPageContext';
import {
  track,
  CW_ANALYTICS_SCHEMA_VERSION,
  CW_ANALYTICS_TRANSPORT_EVENT,
  setAnalyticsTransportModeForTests,
} from '@/lib/tracking/analytics';
import { tracking } from '@/lib/tracking/dataLayer';
import {
  resetEmailVerifiedQueryTrackingForTests,
  trackEmailVerifiedFromSearch,
} from '@/lib/tracking/trackEmailVerifiedQuery';
import {
  resetGoogleAuthOutcomeTrackingForTests,
  trackConsumedGoogleAuthOutcome,
} from '@/lib/tracking/trackGoogleAuthOutcome';

vi.mock('@/lib/auth/consumeOAuthAuthOutcome', () => ({
  consumeOAuthAuthOutcome: vi.fn(),
}));

const USER_ID = '9c0b1d2e-3f44-4a55-8b66-777788889999';
const SRC_ROOT = join(process.cwd(), 'src');

const TRACKING_INFRASTRUCTURE = new Set([
  'lib/tracking/analytics/envelope.ts',
  'lib/tracking/analytics/events.ts',
  'lib/tracking/analytics/index.ts',
  'lib/tracking/analytics/legacy.ts',
  'lib/tracking/analytics/pageContext.ts',
  'lib/tracking/analytics/track.ts',
  'lib/tracking/analytics/transport.ts',
  'lib/tracking/analytics/validate.ts',
  'lib/tracking/analyticsPageContext.ts',
  'lib/tracking/consentMode.ts',
  'lib/tracking/dataLayer.ts',
  'lib/tracking/sanitizeAnalyticsPath.ts',
  'lib/tracking/trackEmailVerifiedQuery.ts',
  'lib/tracking/trackGoogleAuthOutcome.ts',
  'components/cookies/ConsentAwareGtm.tsx',
]);

type TestGlobal = {
  window?: {
    dataLayer?: Array<Record<string, unknown>>;
    location: {
      origin: string;
      pathname: string;
      search: string;
      hash: string;
    };
  };
};

function getTestGlobal(): TestGlobal {
  return globalThis as unknown as TestGlobal;
}

function installWindow(pathname = '/') {
  getTestGlobal().window = {
    dataLayer: [],
    location: {
      origin: 'https://example.com',
      pathname,
      search: '',
      hash: '',
    },
  };
}

function dataLayer(): Array<Record<string, unknown>> {
  return getTestGlobal().window?.dataLayer ?? [];
}

function parseEnvelopeParams(event: Record<string, unknown>) {
  expect(event.event).toBe(CW_ANALYTICS_TRANSPORT_EVENT);
  expect(event.cw_schema_version).toBe(CW_ANALYTICS_SCHEMA_VERSION);
  expect(typeof event.cw_event_name).toBe('string');
  expect(typeof event.cw_event_params_json).toBe('string');
  return JSON.parse(String(event.cw_event_params_json)) as Record<
    string,
    unknown
  >;
}

function walkSourceFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '__tests__') continue;
      files.push(...walkSourceFiles(full));
      continue;
    }
    if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      files.push(full);
    }
  }
  return files;
}

const consumeOutcome = vi.mocked(consumeOAuthAuthOutcome);

describe('auth analytics contract', () => {
  beforeEach(() => {
    setAnalyticsTransportModeForTests('legacy');
    installWindow();
    consumeOutcome.mockReset();
    resetGoogleAuthOutcomeTrackingForTests();
    resetEmailVerifiedQueryTrackingForTests();
  });

  afterEach(() => {
    tracking.clearUserId();
    setAnalyticsTransportModeForTests(undefined);
    delete getTestGlobal().window;
    resetAnalyticsPageContextSession();
    vi.restoreAllMocks();
  });

  it('maps email signup to cw_sign_up with method=email', () => {
    track('sign_up', { method: 'email' });
    expect(dataLayer()).toEqual([
      expect.objectContaining({ event: 'cw_sign_up', method: 'email' }),
    ]);
  });

  it('maps Google signup to cw_sign_up with method=google', async () => {
    consumeOutcome.mockResolvedValueOnce('sign_up');
    await trackConsumedGoogleAuthOutcome();
    expect(dataLayer()).toEqual([
      expect.objectContaining({ event: 'cw_sign_up', method: 'google' }),
    ]);
  });

  it('maps email login to cw_login with method=email', () => {
    track('login', { method: 'email' });
    expect(dataLayer()).toEqual([
      expect.objectContaining({ event: 'cw_login', method: 'email' }),
    ]);
  });

  it('maps Google login to cw_login with method=google', async () => {
    consumeOutcome.mockResolvedValueOnce('login');
    await trackConsumedGoogleAuthOutcome();
    expect(dataLayer()).toEqual([
      expect.objectContaining({ event: 'cw_login', method: 'google' }),
    ]);
  });

  it('maps successful email verification to cw_email_verified with method=email', () => {
    track('email_verified', { method: 'email' });
    expect(dataLayer()).toEqual([
      expect.objectContaining({
        event: 'cw_email_verified',
        method: 'email',
      }),
    ]);
  });

  it('does not emit auth events when Google outcome is missing', async () => {
    consumeOutcome.mockResolvedValueOnce(null);
    await trackConsumedGoogleAuthOutcome();
    expect(dataLayer()).toEqual([]);
  });

  it('does not emit email_verified from a verification-email send URL', () => {
    expect(trackEmailVerifiedFromSearch('?email=ada@example.com')).toBe(
      false,
    );
    expect(trackEmailVerifiedFromSearch('')).toBe(false);
    expect(dataLayer()).toEqual([]);
  });

  it('emits V1 envelopes without PII or user_id in params', () => {
    setAnalyticsTransportModeForTests('v1');
    tracking.setUserId(USER_ID);
    track('sign_up', { method: 'email' });
    track('login', { method: 'google' });
    track('email_verified', { method: 'email' });

    const events = dataLayer().filter(
      (event) => event.event === CW_ANALYTICS_TRANSPORT_EVENT,
    );
    expect(events.map((event) => event.cw_event_name)).toEqual([
      'sign_up',
      'login',
      'email_verified',
    ]);

    const raw = JSON.stringify(events);
    expect(raw).not.toContain('ada@');
    expect(raw).not.toContain(USER_ID);

    for (const event of events) {
      const params = parseEnvelopeParams(event);
      expect(params).not.toHaveProperty('user_id');
      expect(params.method === 'email' || params.method === 'google').toBe(
        true,
      );
    }
  });

  it('dual mode emits legacy then V1 from a single track() call', () => {
    setAnalyticsTransportModeForTests('dual');
    track('sign_up', { method: 'google' });
    expect(dataLayer().map((event) => event.event)).toEqual([
      'cw_sign_up',
      CW_ANALYTICS_TRANSPORT_EVENT,
    ]);
  });

  it('does not double-fire Google auth when consume is called concurrently', async () => {
    let calls = 0;
    consumeOutcome.mockImplementation(async () => {
      calls += 1;
      await new Promise((resolve) => setTimeout(resolve, 20));
      return 'login';
    });

    await Promise.all([
      trackConsumedGoogleAuthOutcome(),
      trackConsumedGoogleAuthOutcome(),
    ]);

    expect(calls).toBe(1);
    expect(
      dataLayer().filter((event) => event.event === 'cw_login'),
    ).toHaveLength(1);
  });

  it('does not double-fire email_verified from ?verified=1', () => {
    expect(trackEmailVerifiedFromSearch('?verified=1')).toBe(true);
    expect(trackEmailVerifiedFromSearch('?verified=1')).toBe(true);
    expect(
      dataLayer().filter((event) => event.event === 'cw_email_verified'),
    ).toHaveLength(1);
  });
});

describe('auth analytics product call sites', () => {
  const productFiles = walkSourceFiles(SRC_ROOT)
    .map((file) => relative(SRC_ROOT, file).replaceAll('\\', '/'))
    .filter((rel) => !TRACKING_INFRASTRUCTURE.has(rel));

  it('do not construct raw cw_* auth events or use deprecated helpers', () => {
    const forbidden = [
      /dataLayer\.push/,
      /event:\s*['"]cw_sign_up['"]/,
      /event:\s*['"]cw_login['"]/,
      /event:\s*['"]cw_email_verified['"]/,
      /tracking\.signUp/,
      /tracking\.login\b/,
      /tracking\.emailVerified/,
    ];

    const violations: string[] = [];
    for (const rel of productFiles) {
      const source = readFileSync(join(SRC_ROOT, rel), 'utf8');
      for (const pattern of forbidden) {
        if (pattern.test(source)) {
          violations.push(`${rel} matches ${pattern}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('email signup and login only track after success', () => {
    const signUp = readFileSync(
      join(SRC_ROOT, 'components/auth/SignUpForm.tsx'),
      'utf8',
    );
    const signIn = readFileSync(
      join(SRC_ROOT, 'components/auth/SignInForm.tsx'),
      'utf8',
    );
    expect(signUp).toMatch(
      /if \(!res\.ok\) \{\s*[\s\S]*?return;\s*\}\s*track\('sign_up', \{ method: 'email' \}/,
    );
    expect(signIn).toMatch(
      /if \(!result\?\.ok \|\| result\.error\) \{\s*[\s\S]*?return;\s*\}\s*track\('login', \{ method: 'email' \}/,
    );
  });

  it('OTP resend does not emit email_verified', () => {
    const source = readFileSync(
      join(SRC_ROOT, 'components/auth/VerifyEmailForm.tsx'),
      'utf8',
    );
    const resend = source.slice(source.indexOf('async function handleResend'));
    expect(resend).not.toContain("track('email_verified'");
    expect(source).toContain("track('email_verified', { method: 'email' })");
  });
});
