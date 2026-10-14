import { afterEach, describe, expect, it } from 'vitest';

import {
  COOKIE_CONSENT_STORAGE_KEY,
  COOKIE_CONSENT_VERSION,
  type CookieConsentState,
} from '@/lib/cookies/consentStorage';
import {
  DENIED_GOOGLE_CONSENT,
  buildConsentModeBootstrapScript,
  googleConsentFromCookieConsent,
  updateGoogleConsentMode,
} from '@/lib/tracking/consentMode';

function consent(
  partial: Pick<CookieConsentState, 'analytics' | 'marketing'>,
): CookieConsentState {
  return {
    version: COOKIE_CONSENT_VERSION,
    necessary: true,
    preferences: false,
    analytics: partial.analytics,
    marketing: partial.marketing,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('googleConsentFromCookieConsent', () => {
  it('defaults a new visitor to denied', () => {
    expect(googleConsentFromCookieConsent(null)).toEqual(DENIED_GOOGLE_CONSENT);
  });

  it('maps analytics consent to analytics_storage only', () => {
    expect(
      googleConsentFromCookieConsent(
        consent({ analytics: true, marketing: false }),
      ),
    ).toEqual({
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
  });

  it('maps marketing consent to all three ad signals', () => {
    expect(
      googleConsentFromCookieConsent(
        consent({ analytics: false, marketing: true }),
      ),
    ).toEqual({
      analytics_storage: 'denied',
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
    });
  });

  it('grants every signal when both categories are enabled', () => {
    expect(
      googleConsentFromCookieConsent(
        consent({ analytics: true, marketing: true }),
      ),
    ).toEqual({
      analytics_storage: 'granted',
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
    });
  });
});

describe('buildConsentModeBootstrapScript', () => {
  it('sets Consent Mode v2 defaults to denied before GTM', () => {
    const script = buildConsentModeBootstrapScript();
    expect(script).toContain("gtag('consent','default'");
    expect(script).toContain('"analytics_storage":"denied"');
    expect(script).toContain('"ad_storage":"denied"');
    expect(script).toContain('"ad_user_data":"denied"');
    expect(script).toContain('"ad_personalization":"denied"');
    expect(script).toContain(COOKIE_CONSENT_STORAGE_KEY);
    expect(script).toContain(COOKIE_CONSENT_VERSION);
    expect(script).toContain("gtag('consent','update'");
  });
});

describe('updateGoogleConsentMode', () => {
  type TestGlobal = {
    window?: {
      dataLayer?: Array<unknown>;
      gtag?: (...args: unknown[]) => void;
    };
  };

  afterEach(() => {
    delete (globalThis as TestGlobal).window;
  });

  it('pushes an immediate consent update', () => {
    const gtag = (...args: unknown[]) => {
      ((globalThis as TestGlobal).window!.dataLayer ??= []).push(args);
    };
    (globalThis as TestGlobal).window = { dataLayer: [], gtag };

    updateGoogleConsentMode(consent({ analytics: true, marketing: false }));

    expect((globalThis as TestGlobal).window?.dataLayer).toEqual([
      [
        'consent',
        'update',
        {
          analytics_storage: 'granted',
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied',
        },
      ],
    ]);
  });

  it('revokes all signals when consent is cleared', () => {
    const calls: unknown[] = [];
    (globalThis as TestGlobal).window = {
      dataLayer: [],
      gtag: (...args: unknown[]) => {
        calls.push(args);
      },
    };

    updateGoogleConsentMode(null);

    expect(calls).toEqual([['consent', 'update', DENIED_GOOGLE_CONSENT]]);
  });
});
