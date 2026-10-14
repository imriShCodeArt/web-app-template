'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

import { tracking } from '@/lib/tracking/dataLayer';
import { isAnalyticsUserId } from '@/lib/tracking/sanitizeAnalyticsPath';

/**
 * Publishes the authenticated `users.id` UUID to GTM/GA4 as `user_id` once the
 * session is resolved. Clears it when the session is unauthenticated.
 */
export function AnalyticsUserId() {
  const { data, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;

    const userId = data?.user?.id;
    if (status === 'authenticated' && isAnalyticsUserId(userId)) {
      tracking.setUserId(userId);
      return;
    }

    if (status === 'unauthenticated') {
      tracking.clearUserId();
    }
  }, [status, data?.user?.id]);

  return null;
}
