/** First-party key for the stored consent JSON (localStorage). */
export const COOKIE_CONSENT_STORAGE_KEY = 'cookie_consent';

/** Bump when cookie policy / categories change so the banner can reappear. */
export const COOKIE_CONSENT_VERSION = '2026-05-18';

export type CookieConsentState = {
  version: string;
  necessary: true;
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
  createdAt: string;
  updatedAt: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function parseCookieConsent(
  raw: string | null,
): CookieConsentState | null {
  if (raw == null || raw === '') return null;
  try {
    const data: unknown = JSON.parse(raw);
    if (!isRecord(data)) return null;
    const version = data.version;
    const createdAt = data.createdAt;
    const updatedAt = data.updatedAt;
    if (
      version !== COOKIE_CONSENT_VERSION ||
      typeof createdAt !== 'string' ||
      typeof updatedAt !== 'string'
    ) {
      return null;
    }
    if (data.necessary !== true) return null;
    if (
      typeof data.preferences !== 'boolean' ||
      typeof data.analytics !== 'boolean' ||
      typeof data.marketing !== 'boolean'
    ) {
      return null;
    }
    return {
      version,
      necessary: true,
      preferences: data.preferences,
      analytics: data.analytics,
      marketing: data.marketing,
      createdAt,
      updatedAt,
    };
  } catch {
    return null;
  }
}

export function readCookieConsent(): CookieConsentState | null {
  if (typeof window === 'undefined') return null;
  try {
    return parseCookieConsent(
      window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY),
    );
  } catch {
    return null;
  }
}

export function writeCookieConsent(
  partial: Omit<CookieConsentState, 'version' | 'createdAt' | 'updatedAt'> & {
    createdAt?: string;
  },
): CookieConsentState {
  const now = new Date().toISOString();
  const existing = readCookieConsent();
  const next: CookieConsentState = {
    version: COOKIE_CONSENT_VERSION,
    necessary: true,
    preferences: partial.preferences,
    analytics: partial.analytics,
    marketing: partial.marketing,
    createdAt: existing?.createdAt ?? partial.createdAt ?? now,
    updatedAt: now,
  };
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(
      COOKIE_CONSENT_STORAGE_KEY,
      JSON.stringify(next),
    );
  }
  return next;
}

export function clearCookieConsent(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(COOKIE_CONSENT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
