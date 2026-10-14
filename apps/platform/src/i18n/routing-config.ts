import { defaultLocale, locales } from '@template/i18n';
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales,
  defaultLocale,

  // Hebrew (default): no prefix — `/`, `/about`, …
  // Other locales: `/en`, `/en/about`, …
  localePrefix: 'as-needed',

  // Cookie / Accept-Language when visiting unprefixed URLs.
  localeDetection: false,

  pathnames: {
    '/': '/',
    '/about': {
      he: '/about',
      en: '/about',
    },
    '/contact': {
      he: '/contact',
      en: '/contact',
    },
    '/sign-in': {
      he: '/sign-in',
      en: '/sign-in',
    },
    '/sign-up': {
      he: '/sign-up',
      en: '/sign-up',
    },
    '/auth-error': {
      he: '/auth-error',
      en: '/auth-error',
    },
    '/auth/oauth-popup': {
      he: '/auth/oauth-popup',
      en: '/auth/oauth-popup',
    },
    '/verify-email': {
      he: '/verify-email',
      en: '/verify-email',
    },
    '/forgot-password': {
      he: '/forgot-password',
      en: '/forgot-password',
    },
    '/reset-password': {
      he: '/reset-password',
      en: '/reset-password',
    },
    '/account': {
      he: '/account',
      en: '/account',
    },
    '/privacy': {
      he: '/privacy',
      en: '/privacy',
    },
    '/cookies': {
      he: '/cookies',
      en: '/cookies',
    },
    '/terms': {
      he: '/terms',
      en: '/terms',
    },
    '/accessibility': {
      he: '/accessibility',
      en: '/accessibility',
    },
  },
});
