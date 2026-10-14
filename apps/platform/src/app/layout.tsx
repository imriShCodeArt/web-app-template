import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { getLocale } from 'next-intl/server';

import { defaultLocale, getLocaleDirection, isLocale } from '@template/i18n';
import { notoSansHebrew } from '@/lib/fonts';
import { getColorModeFromCookies } from '@/lib/cookies/theme';

import './globals.css';

/**
 * Third-party tags (e.g. Google Tag Manager) are injected client-side with
 * Advanced Consent Mode v2 via `ConsentAwareGtm` — see `CookieConsentProvider`.
 */

type RootLayoutProps = {
  children: ReactNode;
};

export default async function RootLayout({ children }: RootLayoutProps) {
  const rawLocale = await getLocale();
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const dir = getLocaleDirection(locale);
  const cookieStore = await cookies();
  const colorMode = getColorModeFromCookies(cookieStore);

  return (
    <html
      lang={locale}
      dir={dir}
      data-theme={colorMode}
      className={notoSansHebrew.variable}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
