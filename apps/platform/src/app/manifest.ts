import type { MetadataRoute } from 'next';

import { siteConfig } from '@template/config';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.shortName,
    short_name: siteConfig.shortName,
    description: 'A multilingual web application.',
    start_url: '/',
    display: 'browser',
    background_color: '#ffffff',
    theme_color: '#2364D8',
  };
}
