const MAX_LEN = 2048;

/**
 * Allow only same-origin relative paths for post-auth redirects.
 * Rejects protocol-relative URLs and other open-redirect shapes.
 */
export function safeInternalPath(
  raw: string | null | undefined,
): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (value.length === 0 || value.length > MAX_LEN) return null;
  if (!value.startsWith('/')) return null;
  if (value.startsWith('//') || value.startsWith('/\\')) return null;
  if (value.includes('\\') || value.includes('\0')) return null;
  if (/[\r\n]/.test(value)) return null;
  if (value.includes('://')) return null;
  return value;
}
