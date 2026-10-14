import { isAnalyticsUserId } from '@/lib/tracking/sanitizeAnalyticsPath';

export type {
  AuthMethod,
  ContactMethod,
  LeadType,
  TrackingErrorType,
} from '@/lib/tracking/analytics';

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (...args: unknown[]) => void;
  }
}

let identifiedUserId: string | undefined;

function pushUserId(userId: string | null): void {
  if (typeof window === 'undefined') return;

  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ user_id: userId });
  window.gtag?.('set', { user_id: userId });
}

/**
 * User-ID lifecycle. Product code should call `track()` for business events.
 */
export const tracking = {
  /**
   * Sets GA4 User-ID to the authenticated `users.id` UUID.
   * No-op for anonymous visitors and non-UUID values (email, names, etc.).
   */
  setUserId(userId: string): void {
    if (!isAnalyticsUserId(userId)) return;
    if (identifiedUserId === userId) return;
    identifiedUserId = userId;
    pushUserId(userId);
  },

  /** Clears User-ID after logout. Does not invent an id for anonymous users. */
  clearUserId(): void {
    if (identifiedUserId === undefined) return;
    identifiedUserId = undefined;
    pushUserId(null);
  },
};
