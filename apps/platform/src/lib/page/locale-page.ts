import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import type { Locale } from '@template/i18n';
import { sitemapLastModifiedByPath } from '@/config/sitemap-last-modified';
import { buildBreadcrumbJsonLd } from '@/lib/seo/json-ld';
import {
  createPageMetadata,
  createPrivatePageMetadata,
  type PageMetadataOptions,
} from '@/lib/seo/metadata';
import { resolvePageLocale } from '@/lib/seo/resolve-locale';
import { indexableRoutes, type IndexableRoute } from '@/lib/seo/routes';

import type { LocalePageProps } from './types';

export type CreateLocalePageMetadataOptions = {
  params: LocalePageProps['params'];
  path: string;
  /** next-intl namespace (e.g. `pages.about`, `crm`, `auth.account`). */
  namespace: string;
  titleKey?: string;
  descriptionKey?: string;
  private?: boolean;
  keywords?: string[];
  openGraphType?: PageMetadataOptions['openGraphType'];
};

/** Shared `generateMetadata` helper for localized marketing / app pages. */
export async function createLocalePageMetadata({
  params,
  path,
  namespace,
  titleKey = 'metaTitle',
  descriptionKey = 'metaDescription',
  private: isPrivate = false,
  keywords,
  openGraphType,
}: CreateLocalePageMetadataOptions): Promise<Metadata> {
  const locale = resolvePageLocale((await params).locale);
  const t = await getTranslations({ locale, namespace });

  const options = {
    locale,
    path,
    title: t(titleKey),
    description: t(descriptionKey),
    keywords,
    openGraphType,
  };

  return isPrivate
    ? createPrivatePageMetadata(options)
    : createPageMetadata(options);
}

export async function getLocalePageContext(
  params: LocalePageProps['params'],
  namespace: string,
) {
  const locale = resolvePageLocale((await params).locale);
  const [t, navT] = await Promise.all([
    getTranslations({ locale, namespace }),
    getTranslations({ locale, namespace: 'navigation' }),
  ]);

  return { locale, t, navT };
}

type LocalePageDefinitionOptions = Omit<
  CreateLocalePageMetadataOptions,
  'params'
> & {
  /**
   * Must match `sitemapLastModifiedByPath[path]` in `@/config/sitemap-last-modified`.
   * Bump that config date when this page's content or SEO changes.
   */
  sitemapLastModified?: string;
};

function isIndexableRoute(path: string): path is IndexableRoute {
  return (indexableRoutes as readonly string[]).includes(path);
}

/**
 * Factory for thin localized routes:
 * - exposes `generateMetadata`
 * - resolves `{ locale, t, navT }` for the configured namespace
 * - builds home-first breadcrumb JSON-LD
 */
export function defineLocalePage(options: LocalePageDefinitionOptions) {
  if (options.sitemapLastModified && isIndexableRoute(options.path)) {
    const configured = sitemapLastModifiedByPath[options.path];
    if (configured !== options.sitemapLastModified) {
      throw new Error(
        `sitemapLastModified for ${options.path} must match sitemapLastModifiedByPath (${configured})`,
      );
    }
  }

  return {
    generateMetadata: ({ params }: LocalePageProps) =>
      createLocalePageMetadata({ ...options, params }),
    getContext: (params: LocalePageProps['params']) =>
      getLocalePageContext(params, options.namespace),
    breadcrumbJsonLd: (
      locale: Locale,
      homeLabel: string,
      items: { name: string; path: string }[],
    ) => buildHomeBreadcrumbJsonLd(locale, homeLabel, items),
  };
}

/** Breadcrumb JSON-LD starting with the localized home label. */
export function buildHomeBreadcrumbJsonLd(
  locale: Locale,
  homeLabel: string,
  items: { name: string; path: string }[],
) {
  return buildBreadcrumbJsonLd(locale, [
    { name: homeLabel, path: '/' },
    ...items,
  ]);
}
