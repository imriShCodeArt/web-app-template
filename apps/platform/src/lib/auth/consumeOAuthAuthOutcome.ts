import type { OAuthAuthOutcome } from '@template/auth';

export async function consumeOAuthAuthOutcome(): Promise<OAuthAuthOutcome | null> {
  try {
    const res = await fetch('/api/auth/oauth-outcome', { method: 'POST' });
    if (!res.ok) return null;
    const data = (await res.json()) as { outcome?: unknown };
    return data.outcome === 'sign_up' || data.outcome === 'login'
      ? data.outcome
      : null;
  } catch {
    return null;
  }
}
