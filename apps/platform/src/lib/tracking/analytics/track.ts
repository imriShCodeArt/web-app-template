import type {
  AnalyticsEventMap,
  AnalyticsPrimitive,
  CanonicalEventName,
  TrackArgs,
} from '@/lib/tracking/analytics/events';
import { buildV1Envelope } from '@/lib/tracking/analytics/envelope';
import { toLegacyDataLayerEvent } from '@/lib/tracking/analytics/legacy';
import { getAnalyticsEventPageContext } from '@/lib/tracking/analytics/pageContext';
import {
  getAnalyticsTransportMode,
  pushToDataLayer,
} from '@/lib/tracking/analytics/transport';
import {
  sanitizeBusinessParams,
  validateCanonicalEventName,
  warnAnalyticsDev,
} from '@/lib/tracking/analytics/validate';

function withPageContext(
  params: Record<string, AnalyticsPrimitive>,
): Record<string, AnalyticsPrimitive> {
  const page = getAnalyticsEventPageContext();
  if (!page) return params;
  return {
    ...params,
    page_location: page.page_location,
    page_path: page.page_path,
    page_title: page.page_title,
    page_referrer: page.page_referrer,
  };
}

/**
 * Application-owned analytics API. Product code passes a canonical event name
 * and known params; this module owns validation, page context, schema version,
 * serialization, and transport mode.
 */
export function track<E extends CanonicalEventName>(
  ...args: TrackArgs<E>
): void {
  try {
    emitTrack(
      args[0],
      (args[1] ?? {}) as AnalyticsEventMap[E] | Record<string, never>,
    );
  } catch (err) {
    warnAnalyticsDev('track() swallowed an unexpected error', err);
  }
}

function emitTrack(
  eventName: CanonicalEventName,
  rawParams: AnalyticsEventMap[CanonicalEventName] | Record<string, never>,
): void {
  if (typeof window === 'undefined') return;

  const nameFailure = validateCanonicalEventName(eventName);
  if (nameFailure) {
    warnAnalyticsDev(`dropped event: ${nameFailure.reason}`, eventName);
    return;
  }

  const sanitized = sanitizeBusinessParams(rawParams);
  if (!sanitized.ok) {
    warnAnalyticsDev(`dropped event: ${sanitized.failure.reason}`, {
      eventName,
    });
    return;
  }

  const businessParams =
    eventName === 'email_verified' && sanitized.params.method === undefined
      ? { ...sanitized.params, method: 'email' }
      : sanitized.params;
  const params = withPageContext(businessParams);

  const mode = getAnalyticsTransportMode();

  if (mode === 'legacy' || mode === 'dual') {
    const legacy = toLegacyDataLayerEvent(eventName, businessParams);
    if (legacy) {
      const page = getAnalyticsEventPageContext();
      pushToDataLayer(page ? { ...legacy, ...page } : legacy);
    }
  }

  if (mode === 'dual' || mode === 'v1') {
    pushToDataLayer(buildV1Envelope(eventName, params));
  }
}
