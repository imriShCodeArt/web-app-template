/** Host/path segment shown after the fixed `https://` prefix (no protocol). */
export function stripWebsiteUrlPrefix(raw: string): string {
  const t = raw.trim();
  if (!t) return '';
  return t.replace(/^https?:\/\//i, '').replace(/\/$/, '');
}

/** Full URL for storage, native `type="url"` validation, and `parseWebsiteUrl`. */
export function websiteUrlFromHost(host: string): string {
  const h = stripWebsiteUrlPrefix(host);
  if (!h) return '';
  return `https://${h}`;
}
