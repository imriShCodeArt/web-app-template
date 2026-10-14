'use client';

import { useEffect } from 'react';

import { trackConsumedGoogleAuthOutcome } from '@/lib/tracking/trackGoogleAuthOutcome';
import { trackEmailVerifiedFromSearch } from '@/lib/tracking/trackEmailVerifiedQuery';

/**
 * Catches Google auth outcomes after a full-page OAuth redirect, and
 * `email_verified` after the magic-link handler redirects to `?verified=1`.
 */
export function AuthAnalyticsBridge() {
  useEffect(() => {
    void trackConsumedGoogleAuthOutcome();

    if (!trackEmailVerifiedFromSearch(window.location.search)) return;

    const params = new URLSearchParams(window.location.search);
    params.delete('verified');
    const search = params.toString();
    const nextUrl =
      window.location.pathname +
      (search ? `?${search}` : '') +
      window.location.hash;
    window.history.replaceState(null, '', nextUrl);
  }, []);

  return null;
}
