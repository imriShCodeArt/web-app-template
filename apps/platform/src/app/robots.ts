import type { MetadataRoute } from 'next';

import { siteConfig } from '@template/config';
import { nonIndexableRoutePatterns } from '@/lib/seo/routes';

export default function robots(): MetadataRoute.Robots {
  const disallow = nonIndexableRoutePatterns.flatMap((path) => [
    path,
    `/en${path}`,
  ]);

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow,
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
