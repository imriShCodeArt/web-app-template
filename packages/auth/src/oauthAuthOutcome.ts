export const OAUTH_AUTH_OUTCOME_COOKIE = 'cw_oauth_auth_outcome';

export type OAuthAuthOutcome = 'sign_up' | 'login';

export function parseOAuthAuthOutcome(
  raw: string | undefined,
): OAuthAuthOutcome | null {
  return raw === 'sign_up' || raw === 'login' ? raw : null;
}
