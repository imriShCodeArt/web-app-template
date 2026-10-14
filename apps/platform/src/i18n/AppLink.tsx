'use client';

import type { ComponentProps } from 'react';

import { IntlLink } from '@/i18n/navigation-base';

/**
 * Locale-aware Link with prefetch disabled by default.
 * Next.js otherwise prefetches every in-viewport link (header, footer, cards),
 * which floods server logs on a single navigation.
 */
export function Link({
  prefetch = false,
  ...props
}: ComponentProps<typeof IntlLink>) {
  return <IntlLink prefetch={prefetch} {...props} />;
}
