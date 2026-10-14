import { getSession } from 'next-auth/react';

import { navigateAfterAuth } from '@/lib/auth/navigateAfterAuth';
import { trackConsumedGoogleAuthOutcome } from '@/lib/tracking/trackGoogleAuthOutcome';

export async function finishGooglePopupSession(options: {
  callbackUrl: string;
  closeAuthModal: () => void;
  /** Kept so existing callers can pass the app router; navigation is a full load. */
  router?: { refresh: () => void };
}): Promise<void> {
  // Wait until the popup's session cookie is readable, but do not broadcast
  // into SessionProvider. A broadcast would open onboarding dialogs on this
  // page, then navigateAfterAuth would reload and show them again.
  await getSession({ broadcast: false });
  await trackConsumedGoogleAuthOutcome();
  options.closeAuthModal();
  navigateAfterAuth(options.callbackUrl);
}
