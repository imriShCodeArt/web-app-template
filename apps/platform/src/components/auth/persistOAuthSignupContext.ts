export type PersistOAuthSignupContextInput = {
  acceptTerms?: true;
  marketingConsent?: boolean;
  website?: string;
};

/**
 * Stores terms, marketing preference, and an optional website on a short-lived
 * cookie so Google OAuth `createUser` can apply them after the redirect.
 */
export async function persistOAuthSignupContext(
  input: PersistOAuthSignupContextInput,
): Promise<boolean> {
  const res = await fetch('/api/auth/oauth-signup-consent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return res.ok;
}
