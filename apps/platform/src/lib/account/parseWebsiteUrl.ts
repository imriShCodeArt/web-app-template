export type WebsiteParseResult =
  { ok: true; normalized: string } | { ok: false; reason: 'empty' | 'invalid' };

/**
 * Validates and normalizes a public website URL for storage (always stores absolute http/https URL).
 */
export function parseWebsiteUrl(raw: string): WebsiteParseResult {
  const t = raw.trim();
  if (t.length === 0) return { ok: false, reason: 'empty' };
  try {
    const withProto = /^https?:\/\//i.test(t) ? t : `https://${t}`;
    const u = new URL(withProto);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      return { ok: false, reason: 'invalid' };
    }
    if (!u.hostname) return { ok: false, reason: 'invalid' };
    return { ok: true, normalized: u.href };
  } catch {
    return { ok: false, reason: 'invalid' };
  }
}
