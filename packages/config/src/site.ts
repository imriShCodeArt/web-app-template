import { defaultLocale, locales, type Locale } from '@template/i18n';

import { env } from './env';

export const siteConfig = {
  nameKey: 'site.name',
  descriptionKey: 'site.description',
  shortName: 'Web App',
  /** Empty string uses the text mark in the header instead of an image. */
  logoSrc: '',
  schemaLogoSrc: '',
  logoHeight: 40,
  url: env.NEXT_PUBLIC_SITE_URL,
  ogImage: {
    path: '/og-image.jpg',
    width: 1200,
    height: 630,
    alt: 'Web App',
  },

  defaultLocale,
  locales,
  timeZone: 'Asia/Jerusalem',

  creator: {
    name: 'Your Name',
    url: env.NEXT_PUBLIC_SITE_URL,
  },

  contact: {
    email: 'hello@example.com',
    phone: '+1-555-0100',
  },

  sameAs: [] as const,

  /** Hostnames treated as this app when classifying links. */
  publicSiteUrls: [env.NEXT_PUBLIC_SITE_URL] as const,
} as const;

export type SiteConfig = typeof siteConfig;

export function getLocalizedUrl(locale: Locale, path = '/') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const base = siteConfig.url.replace(/\/$/, '');

  if (locale === defaultLocale) {
    return normalizedPath === '/' ? `${base}/` : `${base}${normalizedPath}`;
  }

  return normalizedPath === '/'
    ? `${base}/${locale}/`
    : `${base}/${locale}${normalizedPath}`;
}

/** Site root URL with trailing slash, for JSON-LD `url` fields. */
export function getSchemaSiteRootUrl() {
  return getLocalizedUrl(defaultLocale, '/');
}

/** Absolute URL for a public asset (OG images, etc.). */
export function getAbsoluteAssetUrl(path: string) {
  const base = siteConfig.url.replace(/\/$/, '');
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}
