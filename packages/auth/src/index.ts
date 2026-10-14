/// <reference path="./next-auth.d.ts" />

export { isAdmin } from './roles';
export { hashPassword, verifyPassword } from './password';
export { getFirstNameOrLocalPart } from './displayName';
export {
  getUserVerificationState,
  isCredentialsSignupUser,
  userIdRequiresEmailVerification,
  userRequiresEmailVerification,
} from './emailVerification';
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
export { encryptString, decryptString } from './encrypt';
