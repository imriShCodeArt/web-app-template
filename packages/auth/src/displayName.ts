/** First word of display name, or email local-part, for greetings. */
export function getFirstNameOrLocalPart(
  name: string | null | undefined,
  email: string | null | undefined,
): string | null {
  const trimmed = name?.trim();
  if (trimmed) {
    return trimmed.split(/\s+/).filter(Boolean)[0] ?? null;
  }
  const local = email?.split('@')[0]?.trim();
  return local && local.length > 0 ? local : null;
}
