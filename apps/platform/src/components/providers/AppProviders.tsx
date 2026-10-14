'use client';

import type { ReactNode } from 'react';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import Box from '@mui/material/Box';
import rtlPlugin from '@mui/stylis-plugin-rtl';
import { prefixer } from 'stylis';
import type { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import { NextIntlClientProvider } from 'next-intl';

import { siteConfig } from '@template/config';
import type { Locale } from '@template/i18n';
import { getLocaleDirection } from '@template/i18n';
import { DocumentDirection, ThemeProvider } from '@template/ui';

import { AuthAnalyticsBridge } from '@/components/auth/AuthAnalyticsBridge';
import { AuthModalProvider } from '@/components/auth/AuthModalProvider';
import { MarketingPreferencePrompt } from '@/components/auth/MarketingPreferencePrompt';
import { TermsAcceptancePrompt } from '@/components/auth/TermsAcceptancePrompt';
import { AnalyticsUserId } from '@/components/cookies/AnalyticsUserId';
import { CookieConsentProvider } from '@/components/cookies/CookieConsentContext';

type AppProvidersProps = {
  children: ReactNode;
  locale: Locale;
  messages: Record<string, unknown>;
  initialColorMode?: 'light' | 'dark';
  initialSession: Session | null;
};

export function AppProviders({
  children,
  locale,
  messages,
  initialColorMode,
  initialSession,
}: AppProvidersProps) {
  const direction = getLocaleDirection(locale);

  const rtlCacheOptions = {
    key: 'muirtl',
    stylisPlugins: [prefixer, rtlPlugin],
  };

  const ltrCacheOptions = {
    key: 'mui',
    stylisPlugins: [prefixer],
  };

  return (
    <SessionProvider
      session={initialSession}
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
      refetchInterval={0}
    >
      <AppRouterCacheProvider
        options={direction === 'rtl' ? rtlCacheOptions : ltrCacheOptions}
      >
        <NextIntlClientProvider
          locale={locale}
          messages={messages}
          timeZone={siteConfig.timeZone}
        >
          <ThemeProvider
            direction={direction}
            initialColorMode={initialColorMode}
          >
            <CookieConsentProvider>
              <DocumentDirection locale={locale} />
              <AuthModalProvider>
                <AuthAnalyticsBridge />
                <AnalyticsUserId />
                <TermsAcceptancePrompt />
                <MarketingPreferencePrompt />
                <Box dir={direction}>{children}</Box>
              </AuthModalProvider>
            </CookieConsentProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </AppRouterCacheProvider>
    </SessionProvider>
  );
}
