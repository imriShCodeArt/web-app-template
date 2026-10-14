import { describe, expect, it } from 'vitest';

import {
  ANALYTICS_AUDIT_PAGE_TITLE,
  ANALYTICS_SENSITIVE_QUERY_KEYS,
  ANALYTICS_SHARE_PAGE_TITLE,
  ANALYTICS_UUID_SEGMENT_PATTERN,
  buildAnalyticsContextBootstrapScript,
  getAnalyticsPageContext,
  isAnalyticsUserId,
  sanitizeAnalyticsHref,
  sanitizeAnalyticsPath,
  sanitizeAnalyticsSearch,
  sanitizeAnalyticsTitle,
} from '@/lib/tracking/sanitizeAnalyticsPath';

const SCAN_ID = '143cc5d8-9da9-4cc2-9e35-69b00f365f64';
const SHARE_ID = '64062b70-3d53-4051-8c02-926010dbb379';

describe('sanitizeAnalyticsPath', () => {
  it('replaces audit UUIDs with :id', () => {
    expect(sanitizeAnalyticsPath(`/audit/${SCAN_ID}`)).toBe('/audit/:id');
  });

  it('replaces share UUIDs with :id', () => {
    expect(sanitizeAnalyticsPath(`/share/${SHARE_ID}`)).toBe('/share/:id');
  });

  it('masks UUIDs in any path segment', () => {
    expect(sanitizeAnalyticsPath(`/leads/${SCAN_ID}`)).toBe('/leads/:id');
  });

  it('keeps a locale prefix', () => {
    expect(sanitizeAnalyticsPath(`/en/audit/${SCAN_ID}`)).toBe('/en/audit/:id');
    expect(sanitizeAnalyticsPath(`/en/share/${SHARE_ID}`)).toBe(
      '/en/share/:id',
    );
  });

  it('leaves static and knowledge paths unchanged', () => {
    expect(sanitizeAnalyticsPath('/terms')).toBe('/terms');
    expect(sanitizeAnalyticsPath('/en/about')).toBe('/en/about');
    expect(sanitizeAnalyticsPath('/knowledge/some-slug')).toBe(
      '/knowledge/some-slug',
    );
  });

  it('does not rewrite non-UUID segments', () => {
    expect(sanitizeAnalyticsPath('/audit/latest')).toBe('/audit/latest');
    expect(sanitizeAnalyticsPath('/share/preview')).toBe('/share/preview');
  });
});

describe('getAnalyticsPageContext', () => {
  it('builds a sanitized four-field context for GA4', () => {
    expect(
      getAnalyticsPageContext({
        origin: 'https://example.com',
        pathname: `/audit/${SCAN_ID}`,
        title: `Audit ${SCAN_ID} | Web App`,
        referrer: `https://example.com/sign-in?callbackUrl=${encodeURIComponent(`/audit/${SCAN_ID}`)}`,
      }),
    ).toEqual({
      page_path: '/audit/:id',
      page_location: 'https://example.com/audit/:id',
      page_title: ANALYTICS_AUDIT_PAGE_TITLE,
      page_referrer: 'https://example.com/sign-in',
    });
  });

  it('preserves campaign query and strips hash', () => {
    expect(
      getAnalyticsPageContext({
        origin: 'https://example.com',
        pathname: `/share/${SHARE_ID}`,
        search: '?utm_source=email',
        hash: '#report',
        title: 'Accessibility audit — https://customer.example',
      }),
    ).toEqual({
      page_path: '/share/:id',
      page_location: 'https://example.com/share/:id?utm_source=email',
      page_title: ANALYTICS_SHARE_PAGE_TITLE,
      page_referrer: '',
    });
  });

  it('strips email query values from page_location', () => {
    expect(
      getAnalyticsPageContext({
        origin: 'https://example.com',
        pathname: '/verify-email',
        search: '?email=user%40example.com&utm_source=signup',
        title: 'Verify email',
      }),
    ).toEqual({
      page_path: '/verify-email',
      page_location: 'https://example.com/verify-email?utm_source=signup',
      page_title: 'Verify email',
      page_referrer: '',
    });
  });

  it('uses a generic share title even when document.title includes the scanned URL', () => {
    expect(
      sanitizeAnalyticsTitle(
        `/en/share/${SHARE_ID}`,
        'Accessibility audit — https://shop.example/checkout',
      ),
    ).toBe(ANALYTICS_SHARE_PAGE_TITLE);
  });
});

describe('sanitizeAnalyticsSearch', () => {
  it('drops every sensitive query key', () => {
    const search = new URLSearchParams({
      email: 'user@example.com',
      token: 'abc',
      callbackUrl: `/audit/${SCAN_ID}`,
      scanUrl: 'shop.example',
      code: 'oauth-code',
      state: 'oauth-state',
      verification_code: '123456',
      reset_token: SCAN_ID,
      secret: 'webhook',
      otp: '654321',
      q: 'ada@example.com',
      tab: 'scans',
      utm_source: 'email',
    }).toString();

    expect(sanitizeAnalyticsSearch(`?${search}`)).toBe(
      '?tab=scans&utm_source=email',
    );
  });

  it('drops any query value that looks like an email', () => {
    expect(sanitizeAnalyticsSearch('?contact=ada@example.com')).toBe('');
  });

  it('keeps utm_source=email', () => {
    expect(sanitizeAnalyticsSearch('?utm_source=email')).toBe(
      '?utm_source=email',
    );
  });

  it('masks UUIDs inside nested callback-style values that are not dropped keys', () => {
    const sanitized = sanitizeAnalyticsSearch(
      `?next=/audit/${SCAN_ID}&utm_medium=email`,
    );
    const params = new URLSearchParams(sanitized);
    expect(params.get('next')).toBe('/audit/:id');
    expect(params.get('utm_medium')).toBe('email');
  });

  it('strips sensitive keys from nested absolute URLs', () => {
    const nested = `https://example.com/reset-password?token=${SCAN_ID}&utm_source=email`;
    const sanitized = sanitizeAnalyticsSearch(
      `?next=${encodeURIComponent(nested)}`,
    );
    expect(new URLSearchParams(sanitized).get('next')).toBe(
      'https://example.com/reset-password?utm_source=email',
    );
  });
});

describe('sanitizeAnalyticsHref', () => {
  it('masks UUIDs, drops tokens, and strips hashes on referrers', () => {
    expect(
      sanitizeAnalyticsHref(
        `https://example.com/api/auth/verify-email?token=${SCAN_ID}#frag`,
      ),
    ).toBe('https://example.com/api/auth/verify-email');
  });

  it('masks OAuth codes on same-origin callback referrers', () => {
    expect(
      sanitizeAnalyticsHref(
        `https://example.com/api/auth/callback/google?code=abc&state=xyz`,
      ),
    ).toBe('https://example.com/api/auth/callback/google');
  });
});

describe('buildAnalyticsContextBootstrapScript', () => {
  it('embeds UUID masking, sensitive keys, and the four analytics fields', () => {
    const script = buildAnalyticsContextBootstrapScript();
    expect(script).toContain(ANALYTICS_UUID_SEGMENT_PATTERN);
    expect(script).toContain(':id');
    expect(script).toContain('page_title');
    expect(script).toContain('page_referrer');
    expect(script).toContain("gtag('set'");
    expect(script).not.toContain('location.hash');
    expect(script).not.toContain('user_id');
    for (const key of ANALYTICS_SENSITIVE_QUERY_KEYS) {
      expect(script).toContain(key);
    }
  });

  it('executes and pushes four sanitized fields before GTM', () => {
    const script = buildAnalyticsContextBootstrapScript();
    const dataLayer: Array<Record<string, unknown>> = [];
    const fakeWindow: {
      dataLayer: Array<Record<string, unknown>>;
      gtag?: (...args: unknown[]) => void;
    } = { dataLayer };
    const fakeLocation = {
      origin: 'https://example.com',
      pathname: `/audit/${SCAN_ID}`,
      search: `?callbackUrl=/share/${SHARE_ID}&utm_source=email`,
      hash: '#secret',
    };
    const fakeDocument = {
      title: `Audit ${SCAN_ID} | Web App`,
      referrer: `https://example.com/reset-password?token=${SCAN_ID}#x`,
    };

    const run = new Function('window', 'location', 'document', script);
    run(fakeWindow, fakeLocation, fakeDocument);

    expect(dataLayer[0]).toEqual({
      page_path: '/audit/:id',
      page_location: 'https://example.com/audit/:id?utm_source=email',
      page_title: ANALYTICS_AUDIT_PAGE_TITLE,
      page_referrer: 'https://example.com/reset-password',
    });
    expect(fakeWindow.gtag).toEqual(expect.any(Function));
    expect(
      (fakeWindow as { __cwAnalyticsPageContext?: unknown })
        .__cwAnalyticsPageContext,
    ).toEqual(dataLayer[0]);
  });

  it('embeds a validated users.id UUID as user_id', () => {
    const script = buildAnalyticsContextBootstrapScript(SCAN_ID);
    expect(script).toContain(`user_id:'${SCAN_ID}'`);
  });

  it('does not embed email or other non-UUID values as user_id', () => {
    const script = buildAnalyticsContextBootstrapScript('ada@example.com');
    expect(script).not.toContain('user_id');
    expect(script).not.toContain('ada@example.com');
  });
});

describe('isAnalyticsUserId', () => {
  it('accepts a users.id UUID', () => {
    expect(isAnalyticsUserId(SCAN_ID)).toBe(true);
  });

  it('rejects email, empty, and anonymous values', () => {
    expect(isAnalyticsUserId('ada@example.com')).toBe(false);
    expect(isAnalyticsUserId('')).toBe(false);
    expect(isAnalyticsUserId(undefined)).toBe(false);
    expect(isAnalyticsUserId(null)).toBe(false);
  });
});
