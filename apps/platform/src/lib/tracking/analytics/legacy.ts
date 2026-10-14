import type {
  AnalyticsPrimitive,
  CanonicalEventName,
} from '@/lib/tracking/analytics/events';

function pickString(
  params: Record<string, AnalyticsPrimitive>,
  key: string,
): string | undefined {
  const value = params[key];
  return typeof value === 'string' ? value : undefined;
}

/**
 * Maps a canonical `track()` call onto the current production `cw_*` payload.
 * Extra V1-only fields (auth_state, scan_origin, is_first_scan) are omitted.
 * Returns null when there is no legacy equivalent (do not invent new `cw_*` events).
 */
export function toLegacyDataLayerEvent(
  eventName: CanonicalEventName,
  params: Record<string, AnalyticsPrimitive>,
): Record<string, unknown> | null {
  switch (eventName) {
    case 'form_start': {
      const form_name = pickString(params, 'form_name');
      if (!form_name) return null;
      const lead_type = pickString(params, 'lead_type');
      return {
        event: 'cw_form_start',
        form_name,
        ...(lead_type !== undefined ? { lead_type } : {}),
      };
    }
    case 'form_error': {
      const form_name = pickString(params, 'form_name');
      const error_type = pickString(params, 'error_type');
      if (!form_name || !error_type) return null;
      const lead_type = pickString(params, 'lead_type');
      return {
        event: 'cw_form_error',
        form_name,
        error_type,
        ...(lead_type !== undefined ? { lead_type } : {}),
      };
    }
    case 'cta_click': {
      const cta_name = pickString(params, 'cta_name');
      const cta_location = pickString(params, 'cta_location');
      if (!cta_name || !cta_location) return null;
      return {
        event: 'cw_cta_click',
        cta_name,
        cta_location,
      };
    }
    case 'contact_click': {
      const contact_method = pickString(params, 'contact_method');
      const cta_location = pickString(params, 'cta_location');
      if (!contact_method || !cta_location) return null;
      return {
        event: 'cw_contact_click',
        contact_method,
        cta_location,
      };
    }
    case 'scan_attempt': {
      const form_name = pickString(params, 'form_name');
      if (!form_name) return null;
      return {
        event: 'cw_scan_attempt',
        form_name,
      };
    }
    case 'scan_created': {
      const form_name = pickString(params, 'form_name');
      if (!form_name) return null;
      return {
        event: 'cw_scan_success',
        form_name,
      };
    }
    case 'first_scan_success': {
      const form_name = pickString(params, 'form_name');
      if (!form_name) return null;
      return {
        event: 'cw_first_scan_success',
        form_name,
      };
    }
    case 'sign_up': {
      const method = pickString(params, 'method');
      if (!method) return null;
      return { event: 'cw_sign_up', method };
    }
    case 'login': {
      const method = pickString(params, 'method');
      if (!method) return null;
      return { event: 'cw_login', method };
    }
    case 'email_verified': {
      const method = pickString(params, 'method') ?? 'email';
      return { event: 'cw_email_verified', method };
    }
    case 'profile_completed':
      return { event: 'cw_profile_completed' };
    case 'generate_lead': {
      const form_name = pickString(params, 'form_name');
      const lead_type = pickString(params, 'lead_type');
      if (!form_name || !lead_type) return null;
      return {
        event: 'cw_generate_lead',
        form_name,
        lead_type,
        method: 'website_form',
      };
    }
    case 'scan_completed':
    case 'report_unlocked':
    case 'appointment_slot_selected':
    case 'card_verification_started':
    case 'card_verification_success':
    case 'card_verification_failed':
    case 'appointment_booking_confirmed':
      return null;
  }
}
