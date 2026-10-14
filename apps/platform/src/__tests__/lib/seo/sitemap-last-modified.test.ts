import { describe, expect, it } from 'vitest';

import {
  assertSitemapLastModifiedCoverage,
  sitemapLastModifiedByPath,
} from '@/config/sitemap-last-modified';
import { indexableRoutes } from '@/lib/seo/routes';

describe('sitemap last-modified coverage', () => {
  it('defines a baseline date for every indexable static route', () => {
    assertSitemapLastModifiedCoverage();
    for (const path of indexableRoutes) {
      expect(sitemapLastModifiedByPath[path]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
