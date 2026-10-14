import { defaultLocale, isLocale, type Locale } from '@template/i18n';

export function resolvePageLocale(raw: string): Locale {
  return isLocale(raw) ? raw : defaultLocale;
}
