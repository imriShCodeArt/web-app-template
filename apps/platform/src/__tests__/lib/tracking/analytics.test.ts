import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  resetAnalyticsPageContextSession,
  seedAnalyticsPageContext,
} from '@/lib/tracking/analyticsPageContext';
import {
  ANALYTICS_AUDIT_PAGE_TITLE,
  ANALYTICS_SHARE_PAGE_TITLE,
} from '@/lib/tracking/sanitizeAnalyticsPath';
import {
  track,
  CW_ANALYTICS_SCHEMA_VERSION,
  CW_ANALYTICS_TRANSPORT_EVENT,
  getAnalyticsTransportMode,
  setAnalyticsTransportModeForTests,
  type CanonicalEventName,
} from '@/lib/tracking/analytics';
import { sanitizeBusinessParams } from '@/lib/tracking/analytics/validate';
import { tracking } from '@/lib/tracking/dataLayer';

const SCAN_ID = '143cc5d8-9da9-4cc2-9e35-69b00f365f64';
const SHARE_ID = '64062b70-3d53-4051-8c02-926010dbb379';
const USER_ID = '9c0b1d2e-3f44-4a55-8b66-777788889999';

type TestGlobal = {
  window?: {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (...args: unknown[]) => void;
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

function installWindow(pathname = '/', search = '') {
  getTestGlobal().window = {
    dataLayer: [],
    location: {
      origin: 'https://example.com',
      pathname,
      search,
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

describe('track() analytics layer', () => {
  beforeEach(() => {
    setAnalyticsTransportModeForTests('legacy');
    installWindow();
  });

  afterEach(() => {
    tracking.clearUserId();
    setAnalyticsTransportModeForTests(undefined);
    delete getTestGlobal().window;
    resetAnalyticsPageContextSession();
    vi.restoreAllMocks();
  });

  it('defaults transport mode to legacy', () => {
    setAnalyticsTransportModeForTests(undefined);
    expect(getAnalyticsTransportMode()).toBe('legacy');
  });

  it('inlines NEXT_PUBLIC_ANALYTICS_TRANSPORT from a static module-level access', () => {
    const srcRoot = join(process.cwd(), 'src');
    const transport = readFileSync(
      join(srcRoot, 'lib/tracking/analytics/transport.ts'),
      'utf8',
    );
    const nextConfig = readFileSync(
      join(process.cwd(), 'next.config.ts'),
      'utf8',
    );
    expect(transport).toContain(
      'const ANALYTICS_TRANSPORT_FROM_ENV =\n  process.env.NEXT_PUBLIC_ANALYTICS_TRANSPORT;',
    );
    expect(transport).not.toContain(
      'parseTransportMode(process.env.NEXT_PUBLIC_ANALYTICS_TRANSPORT)',
    );
    expect(nextConfig).toContain('NEXT_PUBLIC_ANALYTICS_TRANSPORT:');
    expect(nextConfig).toContain(
      'process.env.NEXT_PUBLIC_ANALYTICS_TRANSPORT ??',
    );
  });

  it('emits the existing cw_* payload in legacy mode', () => {
    track('scan_created', { form_name: 'free_scan_form_hero' });

    expect(dataLayer()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: 'cw_scan_success',
          form_name: 'free_scan_form_hero',
        }),
      ]),
    );
    expect(
      dataLayer().some((e) => e.event === CW_ANALYTICS_TRANSPORT_EVENT),
    ).toBe(false);
  });

  it('does not classify free-scan form_start as a lead', () => {
    track('form_start', { form_name: 'free_scan_form_hero' });

    const [event] = dataLayer();
    expect(event).toEqual(
      expect.objectContaining({
        event: 'cw_form_start',
        form_name: 'free_scan_form_hero',
      }),
    );
    expect(event).not.toHaveProperty('lead_type');
  });

  it('does not put lead_type on scan_created legacy events', () => {
    track('scan_created', { form_name: 'free_scan_form_hero' });
    const [event] = dataLayer();
    expect(event).not.toHaveProperty('lead_type');
    expect(event).not.toHaveProperty('method');
  });

  it('emits only the V1 envelope in v1 mode', () => {
    setAnalyticsTransportModeForTests('v1');
    track('cta_click', {
      cta_name: 'free_scan_hero',
      cta_location: 'homepage_hero',
    });

    expect(dataLayer()).toHaveLength(1);
    const params = parseEnvelopeParams(dataLayer()[0]!);
    expect(dataLayer()[0]).toEqual(
      expect.objectContaining({
        event: CW_ANALYTICS_TRANSPORT_EVENT,
        cw_event_name: 'cta_click',
        cw_schema_version: 1,
      }),
    );
    expect(params).toEqual(
      expect.objectContaining({
        cta_name: 'free_scan_hero',
        cta_location: 'homepage_hero',
        page_path: '/',
        page_location: 'https://example.com/',
      }),
    );
    expect(params).not.toHaveProperty('user_id');
  });

  it('omits undefined values from serialized params', () => {
    setAnalyticsTransportModeForTests('v1');
    const result = sanitizeBusinessParams({
      form_name: 'contact_page_form',
      lead_type: 'contact_form',
      auth_state: undefined,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.params).not.toHaveProperty('auth_state');
    }
    track('form_start', {
      form_name: 'contact_page_form',
      lead_type: 'contact_form',
    });
    const params = parseEnvelopeParams(dataLayer()[0]!);
    expect(params).toEqual(
      expect.objectContaining({
        form_name: 'contact_page_form',
        lead_type: 'contact_form',
      }),
    );
    expect(params).not.toHaveProperty('auth_state');
  });

  it('serializes booleans as booleans', () => {
    setAnalyticsTransportModeForTests('v1');
    track('scan_created', {
      form_name: 'free_scan_form_hero',
      is_first_scan: true,
    });

    const params = parseEnvelopeParams(dataLayer()[0]!);
    expect(params.is_first_scan).toBe(true);
    expect(params.is_first_scan).not.toBe('true');
  });

  it('dual mode sends legacy then V1', () => {
    setAnalyticsTransportModeForTests('dual');
    track('login', { method: 'google' });

    expect(dataLayer().map((e) => e.event)).toEqual([
      'cw_login',
      CW_ANALYTICS_TRANSPORT_EVENT,
    ]);
    expect(dataLayer()[0]).toEqual(
      expect.objectContaining({ event: 'cw_login', method: 'google' }),
    );
    expect(dataLayer()[1]).toEqual(
      expect.objectContaining({
        event: CW_ANALYTICS_TRANSPORT_EVENT,
        cw_event_name: 'login',
      }),
    );
  });

  it('does not invent a legacy event for scan_completed', () => {
    track('scan_completed', { form_name: 'free_scan_form_hero' });
    expect(dataLayer()).toEqual([]);
  });

  it('does not invent legacy events for appointment card-verification funnel', () => {
    track('appointment_slot_selected', {
      form_name: 'consult_booking',
      lead_type: 'consult',
    });
    track('card_verification_started', {
      form_name: 'consult_booking',
      lead_type: 'consult',
    });
    expect(dataLayer()).toEqual([]);
  });

  it('emits appointment funnel events only as V1', () => {
    setAnalyticsTransportModeForTests('v1');
    track('appointment_booking_confirmed', {
      form_name: 'consult_booking',
      lead_type: 'consult',
    });
    expect(dataLayer()).toHaveLength(1);
    expect(dataLayer()[0]).toEqual(
      expect.objectContaining({
        event: CW_ANALYTICS_TRANSPORT_EVENT,
        cw_event_name: 'appointment_booking_confirmed',
      }),
    );
    expect(String(dataLayer()[0]?.cw_event_params_json)).not.toContain('token');
    expect(String(dataLayer()[0]?.cw_event_params_json)).not.toContain('sumit');
  });

  it('emits scan_completed only as V1 when mode is v1', () => {
    setAnalyticsTransportModeForTests('v1');
    track('scan_completed');
    expect(dataLayer()).toHaveLength(1);
    expect(dataLayer()[0]).toEqual(
      expect.objectContaining({
        event: CW_ANALYTICS_TRANSPORT_EVENT,
        cw_event_name: 'scan_completed',
      }),
    );
  });

  it('does not throw when window is missing (SSR)', () => {
    delete getTestGlobal().window;
    expect(() =>
      track('cta_click', { cta_name: 'nav_home', cta_location: 'header' }),
    ).not.toThrow();
  });

  it('does not throw into application flow when validation fails', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() =>
      track('cta_click', {
        cta_name: 'ada@example.com',
        cta_location: 'header',
      }),
    ).not.toThrow();
    expect(dataLayer()).toEqual([]);
    expect(warn).toHaveBeenCalled();
  });

  it('attaches sanitized page context and masks audit/share ids', () => {
    setAnalyticsTransportModeForTests('v1');
    installWindow(`/audit/${SCAN_ID}`, `?token=secret&utm_source=email`);
    seedAnalyticsPageContext({
      origin: 'https://example.com',
      pathname: `/audit/${SCAN_ID}`,
      search: '?token=secret&utm_source=email',
      title: `Audit ${SCAN_ID} for https://customer.example`,
      referrer: `https://example.com/share/${SHARE_ID}?email=ada@example.com`,
    });

    track('cta_click', {
      cta_name: 'audit_download_report',
      cta_location: 'audit_page',
    });

    const raw = JSON.stringify(dataLayer());
    expect(raw).not.toContain(SCAN_ID);
    expect(raw).not.toContain(SHARE_ID);
    expect(raw).not.toContain('ada@example.com');
    expect(raw).not.toContain('token=secret');
    expect(raw).not.toContain('customer.example');

    const params = parseEnvelopeParams(dataLayer()[0]!);
    expect(params.page_path).toBe('/audit/:id');
    expect(params.page_location).toBe(
      'https://example.com/audit/:id?utm_source=email',
    );
    expect(params.page_title).toBe(ANALYTICS_AUDIT_PAGE_TITLE);
    expect(params.page_referrer).toBe('https://example.com/share/:id');
    expect(params.page_title).not.toBe(ANALYTICS_SHARE_PAGE_TITLE);
  });

  it('does not put user_id on business events', () => {
    setAnalyticsTransportModeForTests('dual');
    tracking.setUserId(USER_ID);
    track('profile_completed');

    const events = dataLayer();
    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ user_id: USER_ID }),
        expect.objectContaining({ event: 'cw_profile_completed' }),
        expect.objectContaining({
          event: CW_ANALYTICS_TRANSPORT_EVENT,
          cw_event_name: 'profile_completed',
        }),
      ]),
    );
    const envelope = events.find(
      (e) => e.event === CW_ANALYTICS_TRANSPORT_EVENT,
    );
    expect(String(envelope?.cw_event_params_json)).not.toContain('user_id');
    expect(String(envelope?.cw_event_params_json)).not.toContain(USER_ID);
  });
});

describe('analytics runtime validation', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('accepts legitimate form_name and cta_name keys', () => {
    const result = sanitizeBusinessParams({
      form_name: 'free_scan_form_hero',
      cta_name: 'free_scan_hero',
      cta_location: 'homepage_hero',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.params).toEqual({
        form_name: 'free_scan_form_hero',
        cta_name: 'free_scan_hero',
        cta_location: 'homepage_hero',
      });
    }
  });

  it('rejects nested objects and arrays', () => {
    expect(sanitizeBusinessParams({ form_name: { nested: true } }).ok).toBe(
      false,
    );
    expect(sanitizeBusinessParams({ form_name: ['a'] }).ok).toBe(false);
    expect(sanitizeBusinessParams({ extra: { a: 1 } }).ok).toBe(false);
  });

  it('rejects non-snake_case parameter names', () => {
    const result = sanitizeBusinessParams({ formName: 'x' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failure.reason).toContain('param_name_not_snake_case');
    }
  });

  it('rejects PII keys and values without treating form_name as a person name', () => {
    expect(sanitizeBusinessParams({ email: 'a@b.c' }).ok).toBe(false);
    expect(sanitizeBusinessParams({ phone: '+972500000000' }).ok).toBe(false);
    expect(sanitizeBusinessParams({ name: 'Ada' }).ok).toBe(false);
    expect(sanitizeBusinessParams({ user_id: USER_ID }).ok).toBe(false);
    expect(sanitizeBusinessParams({ notes: 'please call me' }).ok).toBe(false);
    expect(sanitizeBusinessParams({ form_name: 'ada@example.com' }).ok).toBe(
      false,
    );
    expect(sanitizeBusinessParams({ form_name: `audit-${SCAN_ID}` }).ok).toBe(
      false,
    );
    expect(
      sanitizeBusinessParams({ form_name: 'https://scanned.example' }).ok,
    ).toBe(false);
    expect(sanitizeBusinessParams({ form_name: '{"email":"a@b.c"}' }).ok).toBe(
      false,
    );
    expect(sanitizeBusinessParams({ is_first_scan: 'true' }).ok).toBe(false);
    expect(sanitizeBusinessParams({ last4: '1234' }).ok).toBe(false);
    expect(sanitizeBusinessParams({ card_token: 'abc' }).ok).toBe(false);
    expect(sanitizeBusinessParams({ cvv: '123' }).ok).toBe(false);
  });

  it('drops unknown event names without sending', () => {
    installWindow();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    track(
      'not_in_vocabulary' as CanonicalEventName,
      {
        form_name: 'x',
      } as never,
    );
    expect(dataLayer()).toEqual([]);
    expect(warn).toHaveBeenCalled();
    delete getTestGlobal().window;
    resetAnalyticsPageContextSession();
  });
});
