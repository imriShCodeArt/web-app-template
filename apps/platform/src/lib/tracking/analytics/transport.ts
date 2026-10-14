export const ANALYTICS_TRANSPORT_MODES = ['legacy', 'dual', 'v1'] as const;

export type AnalyticsTransportMode = (typeof ANALYTICS_TRANSPORT_MODES)[number];

/**
 * Build-time public env. Must be a top-level `process.env.NEXT_PUBLIC_*`
 * access so Next inlines it into the client bundle (same pattern as
 * `NEXT_PUBLIC_GTM_ID` in ConsentAwareGtm). Reading it inside a function
 * can leave the browser with `undefined`, which this module treats as
 * `legacy`.
 */
const ANALYTICS_TRANSPORT_FROM_ENV =
  process.env.NEXT_PUBLIC_ANALYTICS_TRANSPORT;

let modeOverride: AnalyticsTransportMode | undefined;

function parseTransportMode(value: string | undefined): AnalyticsTransportMode {
  const normalized = value?.trim().toLowerCase();
  if (normalized === 'legacy' || normalized === 'dual' || normalized === 'v1') {
    return normalized;
  }
  return 'legacy';
}

export function getAnalyticsTransportMode(): AnalyticsTransportMode {
  if (modeOverride !== undefined) return modeOverride;
  return parseTransportMode(ANALYTICS_TRANSPORT_FROM_ENV);
}

/** Test-only. Pass `undefined` to restore env/default (`legacy`). */
export function setAnalyticsTransportModeForTests(
  mode: AnalyticsTransportMode | undefined,
): void {
  modeOverride = mode;
}

export function pushToDataLayer(payload: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(payload);
}
