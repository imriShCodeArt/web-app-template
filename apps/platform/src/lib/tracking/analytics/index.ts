export { track } from '@/lib/tracking/analytics/track';
export {
  CANONICAL_EVENT_NAMES,
  CW_ANALYTICS_SCHEMA_VERSION,
  CW_ANALYTICS_TRANSPORT_EVENT,
  type AnalyticsEventMap,
  type AnalyticsPageContextParams,
  type AnalyticsPrimitive,
  type AuthMethod,
  type AuthState,
  type CanonicalEventName,
  type ContactMethod,
  type LeadType,
  type ScanOrigin,
  type TrackingErrorType,
} from '@/lib/tracking/analytics/events';
export type { CWAnalyticsEnvelopeV1 } from '@/lib/tracking/analytics/envelope';
export {
  ANALYTICS_TRANSPORT_MODES,
  getAnalyticsTransportMode,
  setAnalyticsTransportModeForTests,
  type AnalyticsTransportMode,
} from '@/lib/tracking/analytics/transport';
