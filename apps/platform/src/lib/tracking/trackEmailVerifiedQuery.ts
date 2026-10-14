import { track } from '@/lib/tracking/analytics';

let verifiedQueryConsumed = false;

/**
 * Emits `email_verified` once when the magic-link redirect used `?verified=1`.
 * Returns true when the query param should be stripped from the URL.
 */
export function trackEmailVerifiedFromSearch(search: string): boolean {
  const raw = search.startsWith('?') ? search.slice(1) : search;
  const params = new URLSearchParams(raw);
  if (params.get('verified') !== '1') return false;
  if (verifiedQueryConsumed) return true;
  verifiedQueryConsumed = true;
  track('email_verified', { method: 'email' });
  return true;
}

/** Test-only. */
export function resetEmailVerifiedQueryTrackingForTests(): void {
  verifiedQueryConsumed = false;
}
