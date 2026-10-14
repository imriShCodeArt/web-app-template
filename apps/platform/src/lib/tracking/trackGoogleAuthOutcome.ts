import { consumeOAuthAuthOutcome } from '@/lib/auth/consumeOAuthAuthOutcome';
import { track } from '@/lib/tracking/analytics';

let inflight: Promise<void> | null = null;

/** Fire exactly one of `sign_up` / `login` from the Auth.js Google outcome. */
export async function trackConsumedGoogleAuthOutcome(): Promise<void> {
  if (inflight) return inflight;
  inflight = consumeAndTrack().finally(() => {
    inflight = null;
  });
  return inflight;
}

async function consumeAndTrack(): Promise<void> {
  const outcome = await consumeOAuthAuthOutcome();
  if (outcome === 'sign_up') {
    track('sign_up', { method: 'google' });
    return;
  }
  if (outcome === 'login') {
    track('login', { method: 'google' });
  }
}

/** Test-only. Clears the in-flight mutex. */
export function resetGoogleAuthOutcomeTrackingForTests(): void {
  inflight = null;
}
