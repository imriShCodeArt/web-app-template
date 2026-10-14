import { getCommittedAnalyticsPageContext } from '@/lib/tracking/analyticsPageContext';
import { getAnalyticsPageContextFromWindow } from '@/lib/tracking/sanitizeAnalyticsPath';
import type { AnalyticsPageContextParams } from '@/lib/tracking/analytics/events';

/**
 * Reuses the SPA sanitization session: committed context when it matches the
 * current URL, otherwise a freshly sanitized window snapshot.
 */
export function getAnalyticsEventPageContext():
  AnalyticsPageContextParams | undefined {
  const committed = getCommittedAnalyticsPageContext();
  const fromWindow = getAnalyticsPageContextFromWindow();
  if (
    committed &&
    fromWindow &&
    committed.page_location === fromWindow.page_location
  ) {
    return committed;
  }
  return committed ?? fromWindow;
}
