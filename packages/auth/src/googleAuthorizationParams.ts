/**
 * Always show Google's account picker instead of silently reusing the last
 * signed-in Google account.
 */
export const GOOGLE_AUTHORIZATION_PARAMS = {
  prompt: 'select_account',
} as const;
