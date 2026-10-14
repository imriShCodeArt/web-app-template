'use client';

import { useLayoutEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

import {
  installAnalyticsHistoryHooks,
  onNextJsRouteChange,
} from '@/lib/tracking/analyticsPageContext';

/**
 * Installs SPA history/title listeners on first mount without emitting.
 * Later pathname changes flush one `cw_analytics_page_ready` hit after the
 * destination URL is current and the analytics title is ready (title
 * mutation or path-derived titles such as /audit/:id).
 */
export function AnalyticsPageContext() {
  const pathname = usePathname();
  const isInitialMount = useRef(true);

  useLayoutEffect(() => {
    installAnalyticsHistoryHooks();
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    onNextJsRouteChange();
  }, [pathname]);

  return null;
}
