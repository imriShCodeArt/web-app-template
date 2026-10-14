import { redirect } from 'next/navigation';

import { auth } from './auth';
import { userIdRequiresEmailVerification } from './emailVerification';

export interface RequireAuthOptions {
  /** Path after login (e.g. `/account`, `/audit/abc`). Passed as `callbackUrl` to the sign-in route. */
  callbackPath?: string;
  /**
   * Skip the email-verification gate (used by apps that do not host
   * `/verify-email`, e.g. the staff CRM).
   */
  skipEmailVerification?: boolean;
}

/**
 * Call in server components or page files that require an authenticated user.
 * Redirects to /sign-in if no session exists, or to /verify-email if a
 * manual (credentials) signup user has not yet verified their email address.
 */
export async function requireAuth(options?: RequireAuthOptions) {
  const session = await auth();

  if (!session?.user) {
    const cb = options?.callbackPath;
    const qs = cb ? `?callbackUrl=${encodeURIComponent(cb)}` : '';
    redirect(`/sign-in${qs}`);
  }

  if (
    !options?.skipEmailVerification &&
    session.user.id &&
    (await userIdRequiresEmailVerification(session.user.id))
  ) {
    const email = session.user.email;
    const qs = email ? `?email=${encodeURIComponent(email)}` : '';
    redirect(`/verify-email${qs}`);
  }

  return session;
}

/**
 * Return the current session without redirecting (null-safe).
 */
export async function getSession() {
  return auth();
}
