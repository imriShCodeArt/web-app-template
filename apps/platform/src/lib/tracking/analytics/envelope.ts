import {
  CW_ANALYTICS_SCHEMA_VERSION,
  CW_ANALYTICS_TRANSPORT_EVENT,
  type AnalyticsPrimitive,
} from '@/lib/tracking/analytics/events';

export type CWAnalyticsEnvelopeV1 = {
  event: typeof CW_ANALYTICS_TRANSPORT_EVENT;
  cw_event_name: string;
  cw_schema_version: typeof CW_ANALYTICS_SCHEMA_VERSION;
  cw_event_params_json: string;
};

export function buildV1Envelope(
  eventName: string,
  params: Record<string, AnalyticsPrimitive>,
): CWAnalyticsEnvelopeV1 {
  return {
    event: CW_ANALYTICS_TRANSPORT_EVENT,
    cw_event_name: eventName,
    cw_schema_version: CW_ANALYTICS_SCHEMA_VERSION,
    cw_event_params_json: JSON.stringify(params),
  };
}
