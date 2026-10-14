/**
 * Full navigation after login/signup so the audit page cannot keep a stale
 * guest payload. `location.assign` is a no-op when the URL is already current.
 */
export function navigateAfterAuth(callbackUrl: string): void {
  const dest = new URL(callbackUrl, window.location.origin);
  const here = `${window.location.pathname}${window.location.search}`;
  const there = `${dest.pathname}${dest.search}`;
  if (here === there) {
    window.location.reload();
    return;
  }
  window.location.assign(callbackUrl);
}
