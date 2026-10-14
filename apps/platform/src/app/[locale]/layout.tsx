import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';

import { AppProviders } from '@/components/providers/AppProviders';
import { AppShell } from '@/components/shell/AppShell';
import { locales, type Locale } from '@template/i18n';
import { siteConfig } from '@template/config';
import { auth } from '@template/auth/server';
import { getColorModeFromCookies } from '@/lib/cookies/theme';
import { resolvePageLocale } from '@/lib/seo/resolve-locale';

type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({
    locale,
  }));
}

export async function generateMetadata({
  params,
}: Pick<LocaleLayoutProps, 'params'>): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = resolvePageLocale(rawLocale);
  const t = await getTranslations({ locale });

  const siteName = t(siteConfig.nameKey);
  const siteDescription = t(siteConfig.descriptionKey);

  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: siteName,
      template: `%s | ${siteConfig.shortName}`,
    },
    description: siteDescription,
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale: rawLocale } = await params;

  if (!hasLocale(locales, rawLocale)) {
    notFound();
  }

  const locale = rawLocale as Locale;
  const messages = await getMessages();
  const session = await auth();
  const cookieStore = await cookies();
  const initialColorMode = getColorModeFromCookies(cookieStore);

  return (
    <AppProviders
      locale={locale}
      messages={messages}
      initialColorMode={initialColorMode}
      initialSession={session}
    >
      <AppShell>{children}</AppShell>
    </AppProviders>
  );
}
