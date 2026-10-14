import {
  CURRENT_PRIVACY_VERSION,
  CURRENT_TERMS_VERSION,
} from '@template/config';
import { indexableRoutes, type IndexableRoute } from '@/lib/seo/routes';

/**
 * Last-modified date (YYYY-MM-DD) for each indexable static route.
 *
 * Bump a route's date when its page content, layout, translations, or SEO metadata
 * change. Terms and privacy follow @/config/legal.
 */
export const sitemapLastModifiedByPath = {
  '/': '2026-10-14',
  '/about': '2026-10-14',
  '/contact': '2026-10-14',
  '/cookies': '2026-10-14',
  '/accessibility': '2026-10-14',
  '/terms': CURRENT_TERMS_VERSION,
  '/privacy': CURRENT_PRIVACY_VERSION,
} as const satisfies Record<IndexableRoute, string>;

export type StaticSitemapRoute = IndexableRoute;

export function getStaticPageLastModified(path: StaticSitemapRoute): Date {
  return new Date(sitemapLastModifiedByPath[path]);
}

/** Ensures every indexable route has a configured baseline date. */
export function assertSitemapLastModifiedCoverage(): void {
  for (const path of indexableRoutes) {
    if (!(path in sitemapLastModifiedByPath)) {
      throw new Error(`Missing sitemap last-modified date for ${path}`);
    }
  }
}
