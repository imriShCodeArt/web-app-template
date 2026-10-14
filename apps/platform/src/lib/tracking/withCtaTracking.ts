import type { MouseEvent } from 'react';

import { track } from '@/lib/tracking/analytics';

/** Stable CTA name for main/footer nav hrefs (e.g. `/services` → `nav_services`). */
export function navCtaName(href: string): string {
  if (href === '/') {
    return 'nav_home';
  }

  return `nav_${href.replace(/^\//, '').replace(/\//g, '_')}`;
}

/** Fire `cta_click` then run the original handler. */
export function withCtaTracking(
  handler: ((event: MouseEvent) => void) | undefined,
  ctaName: string,
  ctaLocation: string,
): (event: MouseEvent) => void {
  return (event) => {
    track('cta_click', { cta_name: ctaName, cta_location: ctaLocation });
    handler?.(event);
  };
}
