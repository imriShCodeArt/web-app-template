import {
  OAUTH_AUTH_OUTCOME_COOKIE,
  parseOAuthAuthOutcome,
} from '@template/auth';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * Reads and clears the one-shot Google auth outcome cookie set by Auth.js
 * `createUser` / `signIn`. Used so the client can emit `sign_up` vs
 * `login` from the backend result, not the UI route.
 */
export async function POST() {
  const store = await cookies();
  const outcome = parseOAuthAuthOutcome(
    store.get(OAUTH_AUTH_OUTCOME_COOKIE)?.value,
  );
  store.delete({
    name: OAUTH_AUTH_OUTCOME_COOKIE,
    path: '/',
  });
  return NextResponse.json({ outcome });
}
