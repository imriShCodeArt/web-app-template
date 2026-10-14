/**
 * Separate entry point (not re-exported from the package root) so consumers
 * that only need pure helpers (roles, password hashing, ...) don't eagerly
 * instantiate NextAuth — which touches `next-auth`/`next/server` internals
 * that some test/runtime environments resolve more strictly than webpack.
 */
export { auth, handlers, signIn, signOut } from './auth';
export { getSession, requireAuth } from './guard';
export type { RequireAuthOptions } from './guard';
export {
  applyOAuthSignupLegalAcceptance,
  applyRequiredLegalAcceptance,
  OAUTH_SIGNUP_CONSENT_COOKIE,
  oauthSignupConsentCookieOptions,
  parseOAuthSignupConsent,
  serializeOAuthSignupConsent,
} from './oauthSignupConsent';
export type { OAuthSignupConsentPayload } from './oauthSignupConsent';
export {
  OAUTH_AUTH_OUTCOME_COOKIE,
  parseOAuthAuthOutcome,
} from './oauthAuthOutcome';
export type { OAuthAuthOutcome } from './oauthAuthOutcome';
