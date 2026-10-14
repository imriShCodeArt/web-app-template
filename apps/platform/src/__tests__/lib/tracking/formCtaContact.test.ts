import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { MouseEvent } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { resetAnalyticsPageContextSession } from '@/lib/tracking/analyticsPageContext';
import {
  track,
  CW_ANALYTICS_SCHEMA_VERSION,
  CW_ANALYTICS_TRANSPORT_EVENT,
  setAnalyticsTransportModeForTests,
  type TrackingErrorType,
} from '@/lib/tracking/analytics';
import { withCtaTracking } from '@/lib/tracking/withCtaTracking';

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

describe('form, CTA, and contact track() contract', () => {
  beforeEach(() => {
    setAnalyticsTransportModeForTests('legacy');
    installWindow();
  });

  afterEach(() => {
    setAnalyticsTransportModeForTests(undefined);
    delete getTestGlobal().window;
    resetAnalyticsPageContextSession();
  });

  it('routes form_start through the centralized layer as cw_form_start', () => {
    track('form_start', {
      form_name: 'contact_page_form',
      lead_type: 'contact_form',
    });

    expect(dataLayer()).toEqual([
      expect.objectContaining({
        event: 'cw_form_start',
        form_name: 'contact_page_form',
        lead_type: 'contact_form',
      }),
    ]);
    expect(dataLayer()[0]).not.toHaveProperty('cw_event_name');
  });

  it.each([
    'required_field',
    'invalid_email',
    'invalid_phone',
    'invalid_url',
    'submission_error',
    'rate_limit',
  ] satisfies TrackingErrorType[])(
    'routes form_error %s through the centralized layer as cw_form_error',
    (errorType) => {
      track('form_error', {
        form_name: 'contact_page_form',
        lead_type: 'contact_form',
        error_type: errorType,
      });

      expect(dataLayer()).toEqual([
        expect.objectContaining({
          event: 'cw_form_error',
          form_name: 'contact_page_form',
          lead_type: 'contact_form',
          error_type: errorType,
        }),
      ]);
    },
  );

  it('routes cta_click through the centralized layer as cw_cta_click', () => {
    track('cta_click', {
      cta_name: 'audit_guest_sign_up',
      cta_location: 'audit_page',
    });

    expect(dataLayer()).toEqual([
      expect.objectContaining({
        event: 'cw_cta_click',
        cta_name: 'audit_guest_sign_up',
        cta_location: 'audit_page',
      }),
    ]);
  });

  it('routes contact_click through the centralized layer as cw_contact_click', () => {
    track('contact_click', {
      contact_method: 'whatsapp',
      cta_location: 'audit_sidebar',
    });

    expect(dataLayer()).toEqual([
      expect.objectContaining({
        event: 'cw_contact_click',
        contact_method: 'whatsapp',
        cta_location: 'audit_sidebar',
      }),
    ]);
  });

  it('emits consult form_start with lead_type consult in legacy mode', () => {
    track('form_start', {
      form_name: 'consult_page_form',
      lead_type: 'consult',
    });

    expect(dataLayer()[0]).toEqual(
      expect.objectContaining({
        event: 'cw_form_start',
        form_name: 'consult_page_form',
        lead_type: 'consult',
      }),
    );
  });

  it('omits lead_type on free-scan form_start and form_error', () => {
    track('form_start', { form_name: 'free_scan_form_hero' });
    track('form_error', {
      form_name: 'free_scan_form_footer',
      error_type: 'required_field',
    });

    const start = dataLayer()[0];
    const error = dataLayer()[1];
    expect(start).toEqual(
      expect.objectContaining({
        event: 'cw_form_start',
        form_name: 'free_scan_form_hero',
      }),
    );
    expect(error).toEqual(
      expect.objectContaining({
        event: 'cw_form_error',
        form_name: 'free_scan_form_footer',
        error_type: 'required_field',
      }),
    );
    expect(start).not.toHaveProperty('lead_type');
    expect(error).not.toHaveProperty('lead_type');
    expect(JSON.stringify(dataLayer())).not.toMatch(
      /"lead_type"\s*:\s*"free_scan"/,
    );
  });

  it('produces the V1 envelope for form, CTA, and contact events', () => {
    setAnalyticsTransportModeForTests('v1');

    track('form_start', {
      form_name: 'footer_contact_form',
      lead_type: 'contact_form',
    });
    track('form_error', {
      form_name: 'consult_page_form',
      lead_type: 'consult',
      error_type: 'invalid_email',
    });
    track('cta_click', {
      cta_name: 'free_scan_hero',
      cta_location: 'homepage_hero',
    });
    track('contact_click', {
      contact_method: 'email',
      cta_location: 'contact_page',
    });

    expect(dataLayer()).toHaveLength(4);
    expect(dataLayer().map((event) => event.event)).toEqual([
      CW_ANALYTICS_TRANSPORT_EVENT,
      CW_ANALYTICS_TRANSPORT_EVENT,
      CW_ANALYTICS_TRANSPORT_EVENT,
      CW_ANALYTICS_TRANSPORT_EVENT,
    ]);
    expect(dataLayer().map((event) => event.cw_event_name)).toEqual([
      'form_start',
      'form_error',
      'cta_click',
      'contact_click',
    ]);

    const formStart = parseEnvelopeParams(dataLayer()[0]!);
    expect(formStart).toEqual(
      expect.objectContaining({
        form_name: 'footer_contact_form',
        lead_type: 'contact_form',
        page_path: '/',
        page_location: 'https://example.com/',
      }),
    );
    expect(formStart).not.toHaveProperty('user_id');
  });

  it('dual mode emits legacy then V1 from a single track() call', () => {
    setAnalyticsTransportModeForTests('dual');
    track('cta_click', {
      cta_name: 'audit_guest_sign_in',
      cta_location: 'audit_page',
    });

    expect(dataLayer().map((event) => event.event)).toEqual([
      'cw_cta_click',
      CW_ANALYTICS_TRANSPORT_EVENT,
    ]);
    expect(dataLayer()[0]).toEqual(
      expect.objectContaining({
        event: 'cw_cta_click',
        cta_name: 'audit_guest_sign_in',
        cta_location: 'audit_page',
      }),
    );
    expect(dataLayer()[1]).toEqual(
      expect.objectContaining({
        event: CW_ANALYTICS_TRANSPORT_EVENT,
        cw_event_name: 'cta_click',
      }),
    );
  });

  it('dual mode does not require withCtaTracking to emit twice', () => {
    setAnalyticsTransportModeForTests('dual');
    const handler = withCtaTracking(
      undefined,
      'audit_guest_sign_up',
      'audit_page',
    );
    handler({} as MouseEvent);

    expect(dataLayer().map((event) => event.event)).toEqual([
      'cw_cta_click',
      CW_ANALYTICS_TRANSPORT_EVENT,
    ]);
  });

  it('attaches sanitized page context centrally, not from the call site', () => {
    setAnalyticsTransportModeForTests('v1');
    track('form_start', {
      form_name: 'contact_page_form',
      lead_type: 'contact_form',
      page_location: 'https://evil.example/leak',
      page_path: '/leaked',
      page_title: 'Leaked title',
      page_referrer: 'https://evil.example',
    } as never);

    const params = parseEnvelopeParams(dataLayer()[0]!);
    expect(params.page_location).toBe('https://example.com/');
    expect(params.page_path).toBe('/');
    expect(params.page_location).not.toContain('evil.example');
    expect(params.page_path).not.toBe('/leaked');
  });
});

describe('form, CTA, and contact product call sites', () => {
  const productFiles = walkSourceFiles(SRC_ROOT)
    .map((file) => relative(SRC_ROOT, file).replaceAll('\\', '/'))
    .filter((rel) => !TRACKING_INFRASTRUCTURE.has(rel));

  it('do not construct raw cw_* business events or dataLayer.push', () => {
    const forbidden = [
      /dataLayer\.push/,
      /event:\s*['"]cw_form_start['"]/,
      /event:\s*['"]cw_form_error['"]/,
      /event:\s*['"]cw_cta_click['"]/,
      /event:\s*['"]cw_contact_click['"]/,
      /tracking\.formStart/,
      /tracking\.formError/,
      /tracking\.ctaClick/,
      /tracking\.contactClick/,
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

  it('do not send lead_type free_scan from form or CTA call sites', () => {
    const violations: string[] = [];
    for (const rel of productFiles) {
      const source = readFileSync(join(SRC_ROOT, rel), 'utf8');
      if (
        /lead_type:\s*['"]free_scan['"]/.test(source) ||
        /leadType:\s*['"]free_scan['"]/.test(source)
      ) {
        violations.push(rel);
      }
    }

    expect(violations).toEqual([]);
  });
});
