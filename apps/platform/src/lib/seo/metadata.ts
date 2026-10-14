import type { Metadata } from 'next';

import { locales, type Locale } from '@template/i18n';
import {
  getAbsoluteAssetUrl,
  getLocalizedUrl,
  siteConfig,
} from '@template/config';

export const privatePageRobots: Metadata['robots'] = {
  index: false,
  follow: false,
};

const openGraphLocaleMap: Record<Locale, string> = {
  he: 'he_IL',
  en: 'en_US',
};

export type PageMetadataOptions = {
  locale: Locale;
  path: string;
  title: string;
  description: string;
  robots?: Metadata['robots'];
  keywords?: string[];
  openGraphType?: 'website' | 'article';
};

export function buildLanguageAlternates(path: string): Record<string, string> {
  const languages: Record<string, string> = {};

  for (const locale of locales) {
    languages[locale] = getLocalizedUrl(locale, path);
  }

  languages['x-default'] = getLocalizedUrl(siteConfig.defaultLocale, path);

  return languages;
}

export function createPageMetadata({
  locale,
  path,
  title,
  description,
  robots,
  keywords,
  openGraphType = 'website',
}: PageMetadataOptions): Metadata {
  const canonical = getLocalizedUrl(locale, path);
  const og = siteConfig.ogImage;
  const ogImageUrl = getAbsoluteAssetUrl(og.path);
  const alternateLocales = locales.filter((item) => item !== locale);

  return {
    title,
    description,
    ...(keywords?.length ? { keywords } : {}),
    alternates: {
      canonical,
      languages: buildLanguageAlternates(path),
    },
    ...(robots ? { robots } : {}),
    openGraph: {
      type: openGraphType,
      title,
      description,
      url: canonical,
      locale: openGraphLocaleMap[locale],
      alternateLocale: alternateLocales.map((item) => openGraphLocaleMap[item]),
      siteName: siteConfig.shortName,
      images: [
        {
          url: ogImageUrl,
          secureUrl: ogImageUrl,
          width: og.width,
          height: og.height,
          alt: title,
          type: 'image/jpeg',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export function createPrivatePageMetadata({
  locale,
  path,
  title,
  description,
}: Omit<PageMetadataOptions, 'robots'>): Metadata {
  return createPageMetadata({
    locale,
    path,
    title,
    description,
    robots: privatePageRobots,
  });
}
