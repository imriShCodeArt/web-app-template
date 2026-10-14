import { signOut, type SignOutParams } from 'next-auth/react';

import { tracking } from '@/lib/tracking/dataLayer';

/** Clears GA4 User-ID, then ends the Auth.js session. */
export function signOutAndClearUserId(options?: SignOutParams<true>) {
  tracking.clearUserId();
  return signOut(options);
}
