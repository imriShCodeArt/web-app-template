export const CW_ANALYTICS_SCHEMA_VERSION = 1 as const;

export const CW_ANALYTICS_TRANSPORT_EVENT = 'cw_analytics_event' as const;

export const CANONICAL_EVENT_NAMES = [
  'form_start',
  'form_error',
  'cta_click',
  'contact_click',
  'scan_attempt',
  'scan_created',
  'scan_completed',
  'report_unlocked',
  'first_scan_success',
  'sign_up',
  'login',
  'email_verified',
  'profile_completed',
  'generate_lead',
  'appointment_slot_selected',
  'card_verification_started',
  'card_verification_success',
  'card_verification_failed',
  'appointment_booking_confirmed',
] as const;

export type CanonicalEventName = (typeof CANONICAL_EVENT_NAMES)[number];

export const CANONICAL_EVENT_NAME_SET: ReadonlySet<string> = new Set(
  CANONICAL_EVENT_NAMES,
);

/** Commercial lead activity only. Free scans are not leads. */
export type LeadType = 'contact_form' | 'consult';

export type ContactMethod = 'phone' | 'email' | 'whatsapp';

export type AuthMethod = 'email' | 'google';

export type AuthState = 'guest' | 'signed_in';

export type ScanOrigin = 'homepage_hero' | 'homepage_footer';

/** GTM `error_type` values for form errors. */
export type TrackingErrorType =
  | 'required_field'
  | 'invalid_email'
  | 'invalid_phone'
  | 'invalid_url'
  | 'submission_error'
  | 'rate_limit';

export type AnalyticsPrimitive = string | number | boolean;

export type AnalyticsPageContextParams = {
  page_location: string;
  page_path: string;
  page_title: string;
  page_referrer: string;
};

type FormStartParams = {
  form_name: string;
  lead_type?: LeadType;
  auth_state?: AuthState;
  scan_origin?: ScanOrigin;
};

type FormErrorParams = {
  form_name: string;
  error_type: TrackingErrorType;
  lead_type?: LeadType;
  auth_state?: AuthState;
  scan_origin?: ScanOrigin;
};

type CtaClickParams = {
  cta_name: string;
  cta_location: string;
};

type ContactClickParams = {
  contact_method: ContactMethod;
  cta_location: string;
};

type ScanAttemptParams = {
  form_name: string;
  auth_state?: AuthState;
  scan_origin?: ScanOrigin;
};

type ScanCreatedParams = {
  form_name: string;
  auth_state?: AuthState;
  scan_origin?: ScanOrigin;
  is_first_scan?: boolean;
};

type ScanCompletedParams = {
  form_name?: string;
  auth_state?: AuthState;
  scan_origin?: ScanOrigin;
};

type ReportUnlockedParams = {
  auth_state?: AuthState;
};

type FirstScanSuccessParams = {
  form_name: string;
  is_first_scan?: boolean;
};

type AuthMethodParams = {
  method: AuthMethod;
};

type EmailVerifiedParams = {
  method: 'email';
};

type ProfileCompletedParams = Record<string, never>;

type GenerateLeadParams = {
  form_name: string;
  lead_type: LeadType;
};

type ConsultBookingParams = {
  form_name: string;
  lead_type?: LeadType;
};

type CardVerificationFailedParams = ConsultBookingParams & {
  error_type?: TrackingErrorType;
};

export type AnalyticsEventMap = {
  form_start: FormStartParams;
  form_error: FormErrorParams;
  cta_click: CtaClickParams;
  contact_click: ContactClickParams;
  scan_attempt: ScanAttemptParams;
  scan_created: ScanCreatedParams;
  scan_completed: ScanCompletedParams;
  report_unlocked: ReportUnlockedParams;
  first_scan_success: FirstScanSuccessParams;
  sign_up: AuthMethodParams;
  login: AuthMethodParams;
  email_verified: EmailVerifiedParams;
  profile_completed: ProfileCompletedParams;
  generate_lead: GenerateLeadParams;
  appointment_slot_selected: ConsultBookingParams;
  card_verification_started: ConsultBookingParams;
  card_verification_success: ConsultBookingParams;
  card_verification_failed: CardVerificationFailedParams;
  appointment_booking_confirmed: ConsultBookingParams;
};

type OptionalParamEvents =
  'profile_completed' | 'scan_completed' | 'report_unlocked';

export type TrackArgs<E extends CanonicalEventName> =
  E extends OptionalParamEvents
    ? [eventName: E, params?: AnalyticsEventMap[E]]
    : [eventName: E, params: AnalyticsEventMap[E]];
