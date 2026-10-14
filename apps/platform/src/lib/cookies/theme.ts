import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';

export type ColorMode = 'light' | 'dark';

/**
 * Reads the preferred color mode from the `app-color-mode` cookie.
 * Returns `'light'` when no valid value is found.
 */
export function getColorModeFromCookies(
  cookieStore: ReadonlyRequestCookies,
): ColorMode {
  const raw = cookieStore.get('app-color-mode')?.value;
  return raw === 'dark' || raw === 'light' ? raw : 'light';
}
