import { locales } from '@template/i18n';
import { getLocalizedUrl } from '@template/config';
import { getStaticPageLastModified } from '@/config/sitemap-last-modified';
import { indexableRoutes } from '@/lib/seo/routes';

export type SitemapEntry = {
  url: string;
  lastModified: Date;
  alternates: Record<string, string>;
};

function buildSitemapEntry(path: string, lastModified: Date): SitemapEntry[] {
  const localizedAlternates = Object.fromEntries(
    locales.map((altLocale) => [altLocale, getLocalizedUrl(altLocale, path)]),
  );
  return locales.map((locale) => ({
    url: getLocalizedUrl(locale, path),
    lastModified,
    alternates: {
      ...localizedAlternates,
      'x-default': getLocalizedUrl('he', path),
    },
  }));
}

export async function getSitemapEntries(): Promise<SitemapEntry[]> {
  return indexableRoutes.flatMap((path) =>
    buildSitemapEntry(path, getStaticPageLastModified(path)),
  );
}
