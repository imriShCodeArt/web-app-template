'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { ConsentAwareGtm } from '@/components/cookies/ConsentAwareGtm';
import { CookieBanner } from '@/components/cookies/CookieBanner';
import { CookiePreferencesDialog } from '@/components/cookies/CookiePreferencesDialog';
import {
  type CookieConsentState,
  readCookieConsent,
  writeCookieConsent,
} from '@/lib/cookies/consentStorage';
import { updateGoogleConsentMode } from '@/lib/tracking/consentMode';

type CookieConsentContextValue = {
  consent: CookieConsentState | null;
  /** True after reading localStorage on the client (avoids SSR/hydration mismatch). */
  consentReady: boolean;
  /** Whether to show the bottom cookie bar (no valid stored choice yet). */
  showBanner: boolean;
  /** Analytics or marketing cookies allowed. GTM still loads in denied Consent Mode. */
  canLoadTrackingScripts: boolean;
  openPreferences: () => void;
  closePreferences: () => void;
  preferencesOpen: boolean;
  acceptAll: () => void;
  rejectNonEssential: () => void;
  saveCustom: (next: {
    preferences: boolean;
    analytics: boolean;
    marketing: boolean;
  }) => void;
};

const CookieConsentContext = createContext<CookieConsentContextValue | null>(
  null,
);

export function useCookieConsent(): CookieConsentContextValue {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    throw new Error(
      'useCookieConsent must be used within CookieConsentProvider',
    );
  }
  return ctx;
}

const BANNER_DELAY_MS = 2000;

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<CookieConsentState | null>(null);
  const [consentReady, setConsentReady] = useState(false);
  const [bannerDelayElapsed, setBannerDelayElapsed] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setConsent(readCookieConsent());
      setConsentReady(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const shouldDelayBanner = consentReady && consent === null;

  useEffect(() => {
    if (!shouldDelayBanner) {
      return;
    }

    const id = window.setTimeout(
      () => setBannerDelayElapsed(true),
      BANNER_DELAY_MS,
    );
    return () => {
      clearTimeout(id);
      setBannerDelayElapsed(false);
    };
  }, [shouldDelayBanner]);

  const canLoadTrackingScripts = Boolean(
    consent && (consent.analytics || consent.marketing),
  );

  const showBanner = consentReady && consent === null && bannerDelayElapsed;

  const openPreferences = useCallback(() => setPreferencesOpen(true), []);
  const closePreferences = useCallback(() => setPreferencesOpen(false), []);

  const acceptAll = useCallback(() => {
    const next = writeCookieConsent({
      necessary: true,
      preferences: true,
      analytics: true,
      marketing: true,
    });
    setConsent(next);
    updateGoogleConsentMode(next);
    setPreferencesOpen(false);
  }, []);

  const rejectNonEssential = useCallback(() => {
    const next = writeCookieConsent({
      necessary: true,
      preferences: false,
      analytics: false,
      marketing: false,
    });
    setConsent(next);
    updateGoogleConsentMode(next);
    setPreferencesOpen(false);
  }, []);

  const saveCustom = useCallback(
    (next: {
      preferences: boolean;
      analytics: boolean;
      marketing: boolean;
    }) => {
      const stored = writeCookieConsent({
        necessary: true,
        preferences: next.preferences,
        analytics: next.analytics,
        marketing: next.marketing,
      });
      setConsent(stored);
      updateGoogleConsentMode(stored);
      setPreferencesOpen(false);
    },
    [],
  );

  const value = useMemo<CookieConsentContextValue>(
    () => ({
      consent,
      consentReady,
      showBanner,
      canLoadTrackingScripts,
      openPreferences,
      closePreferences,
      preferencesOpen,
      acceptAll,
      rejectNonEssential,
      saveCustom,
    }),
    [
      consent,
      consentReady,
      showBanner,
      canLoadTrackingScripts,
      openPreferences,
      closePreferences,
      preferencesOpen,
      acceptAll,
      rejectNonEssential,
      saveCustom,
    ],
  );

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
      {consentReady ? <CookieBanner /> : null}
      {consentReady ? <CookiePreferencesDialog /> : null}
      <ConsentAwareGtm />
    </CookieConsentContext.Provider>
  );
}
