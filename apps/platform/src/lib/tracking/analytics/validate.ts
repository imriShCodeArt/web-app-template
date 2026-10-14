import { ANALYTICS_UUID_SEGMENT_PATTERN } from '@/lib/tracking/sanitizeAnalyticsPath';
import {
  CANONICAL_EVENT_NAME_SET,
  type AnalyticsPrimitive,
} from '@/lib/tracking/analytics/events';

const SNAKE_CASE_PATTERN = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/;
const EMAIL_PATTERN = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const UUID_PATTERN = new RegExp(ANALYTICS_UUID_SEGMENT_PATTERN, 'i');
const SERIALIZED_STRUCTURE_PATTERN = /^\s*[\[{]/;
const HTTP_URL_PATTERN = /^https?:\/\//i;
const PHONE_PATTERN = /^\+?[\d\s().-]{8,20}$/;

/**
 * Exact forbidden keys. Deliberate names only — `form_name` and `cta_name`
 * are not matched by a "contains name" rule.
 */
const FORBIDDEN_PARAM_KEYS = new Set([
  'email',
  'emails',
  'phone',
  'phone_number',
  'mobile',
  'name',
  'first_name',
  'last_name',
  'full_name',
  'username',
  'user_name',
  'display_name',
  'given_name',
  'family_name',
  'password',
  'passwd',
  'otp',
  'pin',
  'code',
  'verification_code',
  'magic_link',
  'reset_token',
  'token',
  'access_token',
  'refresh_token',
  'session',
  'session_token',
  'api_key',
  'authorization',
  'auth_header',
  'cookie',
  'secret',
  'message',
  'messages',
  'notes',
  'note',
  'comment',
  'comments',
  'body',
  'free_text',
  'website',
  'url',
  'target_url',
  'scan_url',
  'scanned_url',
  'href',
  'user_id',
  'scan_id',
  'share_id',
  'share_token',
  'guest_claim_token',
  'ssn',
  'national_id',
  'id_number',
  'passport',
  'cvv',
  'pan',
  'last4',
  'card_brand',
  'card_token',
  'payment_token',
  'payment_method',
  'sumit',
]);

const AUTOMATIC_PAGE_CONTEXT_KEYS = new Set([
  'page_location',
  'page_path',
  'page_title',
  'page_referrer',
]);

export type AnalyticsValidationFailure = {
  reason: string;
};

export function isSnakeCaseIdentifier(value: string): boolean {
  return SNAKE_CASE_PATTERN.test(value);
}

export function warnAnalyticsDev(message: string, detail?: unknown): void {
  if (process.env.NODE_ENV === 'production') return;
  if (detail === undefined) {
    console.warn(`[analytics] ${message}`);
    return;
  }
  console.warn(`[analytics] ${message}`, detail);
}

function looksLikePhone(value: string): boolean {
  const trimmed = value.trim();
  if (!PHONE_PATTERN.test(trimmed)) return false;
  const digits = trimmed.replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 15;
}

function rejectSensitiveString(value: string): string | null {
  if (EMAIL_PATTERN.test(value)) return 'email_address';
  if (UUID_PATTERN.test(value)) return 'raw_id';
  if (HTTP_URL_PATTERN.test(value.trim())) return 'raw_url';
  if (SERIALIZED_STRUCTURE_PATTERN.test(value)) return 'serialized_object';
  if (looksLikePhone(value)) return 'phone_number';
  return null;
}

function isPlainParamsObject(value: unknown): value is Record<string, unknown> {
  if (value == null || typeof value !== 'object') return false;
  if (Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

export function validateCanonicalEventName(
  eventName: unknown,
): AnalyticsValidationFailure | null {
  if (typeof eventName !== 'string' || eventName.trim() === '') {
    return { reason: 'event_name_empty' };
  }
  if (!isSnakeCaseIdentifier(eventName)) {
    return { reason: 'event_name_not_snake_case' };
  }
  if (!CANONICAL_EVENT_NAME_SET.has(eventName)) {
    return { reason: 'event_name_unknown' };
  }
  return null;
}

/**
 * Validates caller-supplied business params. Automatic page-context keys are
 * stripped so `track()` can attach the sanitized context itself.
 */
export function sanitizeBusinessParams(
  params: unknown,
):
  | { ok: true; params: Record<string, AnalyticsPrimitive> }
  | { ok: false; failure: AnalyticsValidationFailure } {
  if (params == null) {
    return { ok: true, params: {} };
  }
  if (!isPlainParamsObject(params)) {
    return { ok: false, failure: { reason: 'params_not_plain_object' } };
  }

  const next: Record<string, AnalyticsPrimitive> = {};

  for (const [key, value] of Object.entries(params)) {
    if (AUTOMATIC_PAGE_CONTEXT_KEYS.has(key)) {
      continue;
    }
    if (value === undefined) {
      continue;
    }
    if (!isSnakeCaseIdentifier(key)) {
      return {
        ok: false,
        failure: { reason: `param_name_not_snake_case:${key}` },
      };
    }
    if (FORBIDDEN_PARAM_KEYS.has(key)) {
      return { ok: false, failure: { reason: `forbidden_param_key:${key}` } };
    }
    if (typeof value === 'boolean' || typeof value === 'number') {
      if (typeof value === 'number' && !Number.isFinite(value)) {
        return { ok: false, failure: { reason: `non_finite_number:${key}` } };
      }
      next[key] = value;
      continue;
    }
    if (typeof value !== 'string') {
      return {
        ok: false,
        failure: { reason: `unsupported_value_type:${key}` },
      };
    }
    if (value === 'true' || value === 'false') {
      return { ok: false, failure: { reason: `boolean_string:${key}` } };
    }
    if (value.trim() === '') {
      continue;
    }
    const sensitive = rejectSensitiveString(value);
    if (sensitive) {
      return {
        ok: false,
        failure: { reason: `sensitive_value:${key}:${sensitive}` },
      };
    }
    next[key] = value;
  }

  return { ok: true, params: next };
}
