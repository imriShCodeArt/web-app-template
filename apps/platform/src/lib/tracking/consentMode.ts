import {
  COOKIE_CONSENT_STORAGE_KEY,
  COOKIE_CONSENT_VERSION,
  type CookieConsentState,
} from '@/lib/cookies/consentStorage';

export type GoogleConsentState = 'granted' | 'denied';

/** Consent Mode v2 signals required by Google Ads + GA4. */
export type GoogleConsentModeSettings = {
  analytics_storage: GoogleConsentState;
  ad_storage: GoogleConsentState;
  ad_user_data: GoogleConsentState;
  ad_personalization: GoogleConsentState;
};

export const DENIED_GOOGLE_CONSENT: GoogleConsentModeSettings = {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
};

/**
 * Analytics cookie category → `analytics_storage`.
 * Marketing cookie category → `ad_storage`, `ad_user_data`, `ad_personalization`.
 * Missing/invalid stored consent is treated as a new visitor (all denied).
 */
export function googleConsentFromCookieConsent(
  consent: CookieConsentState | null,
): GoogleConsentModeSettings {
  if (!consent) {
    return { ...DENIED_GOOGLE_CONSENT };
  }

  const ads: GoogleConsentState = consent.marketing ? 'granted' : 'denied';
  return {
    analytics_storage: consent.analytics ? 'granted' : 'denied',
    ad_storage: ads,
    ad_user_data: ads,
    ad_personalization: ads,
  };
}

function ensureGtag(): (...args: unknown[]) => void {
  window.dataLayer = window.dataLayer ?? [];
  window.gtag =
    window.gtag ??
    function gtagStub() {
      // GTM reads the Arguments object, not a rest-parameter array.
      // eslint-disable-next-line prefer-rest-params -- consent commands must use `arguments`
      window.dataLayer?.push(arguments as unknown as Record<string, unknown>);
    };
  return window.gtag;
}

/** Immediate Consent Mode v2 update (accept / reject / custom / revoke). */
export function updateGoogleConsentMode(
  consent: CookieConsentState | null,
): void {
  if (typeof window === 'undefined') return;
  ensureGtag()('consent', 'update', googleConsentFromCookieConsent(consent));
}

/**
 * Runs before `gtm.js`: default all signals to denied, then restore a valid
 * persisted choice from localStorage when present.
 */
export function buildConsentModeBootstrapScript(): string {
  const denied = JSON.stringify(DENIED_GOOGLE_CONSENT);
  const key = COOKIE_CONSENT_STORAGE_KEY;
  const version = COOKIE_CONSENT_VERSION;

  return `(function(){window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};window.gtag('consent','default',${denied});try{var r=localStorage.getItem('${key}');if(!r)return;var d=JSON.parse(r);if(!d||d.version!=='${version}'||d.necessary!==true||typeof d.analytics!=='boolean'||typeof d.marketing!=='boolean')return;var ads=d.marketing?'granted':'denied';window.gtag('consent','update',{analytics_storage:d.analytics?'granted':'denied',ad_storage:ads,ad_user_data:ads,ad_personalization:ads});}catch(e){}})();`;
}
