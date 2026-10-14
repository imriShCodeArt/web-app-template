import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { tracking } from '@/lib/tracking/dataLayer';
import { track } from '@/lib/tracking/analytics';
import { resetAnalyticsPageContextSession } from '@/lib/tracking/analyticsPageContext';
import { setAnalyticsTransportModeForTests } from '@/lib/tracking/analytics';

type TestGlobal = {
  window?: {
    dataLayer?: Array<Record<string, unknown>>;
    location: {
      origin: string;
      pathname: string;
      search: string;
      hash: string;
    };
  };
};

function getTestGlobal(): TestGlobal {
  return globalThis as unknown as TestGlobal;
}

describe('tracking funnel milestones', () => {
  beforeEach(() => {
    getTestGlobal().window = {
      dataLayer: [],
      location: {
        origin: 'https://example.com',
        pathname: '/',
        search: '',
        hash: '',
      },
    };
  });

  afterEach(() => {
    delete getTestGlobal().window;
    resetAnalyticsPageContextSession();
    setAnalyticsTransportModeForTests(undefined);
  });

  it('pushes cw_scan_attempt without classifying the scan as a lead', () => {
    track('scan_attempt', { form_name: 'free_scan_form_hero' });

    const [event] = getTestGlobal().window?.dataLayer ?? [];
    expect(event).toEqual(
      expect.objectContaining({
        event: 'cw_scan_attempt',
        form_name: 'free_scan_form_hero',
      }),
    );
    expect(event).not.toHaveProperty('lead_type');
  });

  it('maps scan_created to cw_scan_success without lead_type or method', () => {
    track('scan_created', { form_name: 'free_scan_form_hero' });

    const [event] = getTestGlobal().window?.dataLayer ?? [];
    expect(event).toEqual(
      expect.objectContaining({
        event: 'cw_scan_success',
        form_name: 'free_scan_form_hero',
      }),
    );
    expect(event).not.toHaveProperty('lead_type');
    expect(event).not.toHaveProperty('method');
  });

  it('pushes cw_first_scan_success with form_name only', () => {
    track('first_scan_success', { form_name: 'free_scan_form_hero' });

    const [event] = getTestGlobal().window?.dataLayer ?? [];
    expect(event).toEqual(
      expect.objectContaining({
        event: 'cw_first_scan_success',
        form_name: 'free_scan_form_hero',
      }),
    );
    expect(event).not.toHaveProperty('lead_type');
    expect(event).not.toHaveProperty('method');
  });

  it('pushes cw_sign_up and cw_login with method', () => {
    track('sign_up', { method: 'email' });
    track('login', { method: 'google' });

    expect(getTestGlobal().window?.dataLayer).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ event: 'cw_sign_up', method: 'email' }),
        expect.objectContaining({ event: 'cw_login', method: 'google' }),
      ]),
    );
  });

  it('pushes cw_email_verified and cw_profile_completed without PII', () => {
    track('email_verified', { method: 'email' });
    track('profile_completed');

    const events = getTestGlobal().window?.dataLayer ?? [];
    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: 'cw_email_verified',
          method: 'email',
        }),
        expect.objectContaining({ event: 'cw_profile_completed' }),
      ]),
    );
    expect(JSON.stringify(events)).not.toMatch(/@|pending\.clearweb/);
  });
});

describe('tracking user_id', () => {
  const userId = '143cc5d8-9da9-4cc2-9e35-69b00f365f64';

  beforeEach(() => {
    getTestGlobal().window = {
      dataLayer: [],
      location: {
        origin: 'https://example.com',
        pathname: '/',
        search: '',
        hash: '',
      },
    };
  });

  afterEach(() => {
    tracking.clearUserId();
    delete getTestGlobal().window;
    resetAnalyticsPageContextSession();
    setAnalyticsTransportModeForTests(undefined);
  });

  it('pushes the authenticated users.id UUID as user_id', () => {
    tracking.setUserId(userId);

    expect(getTestGlobal().window?.dataLayer).toEqual(
      expect.arrayContaining([expect.objectContaining({ user_id: userId })]),
    );
  });

  it('does not assign user_id from email or other PII', () => {
    tracking.setUserId('ada@example.com');
    tracking.setUserId('anonymous');

    const events = getTestGlobal().window?.dataLayer ?? [];
    expect(events).toEqual([]);
    expect(JSON.stringify(events)).not.toMatch(/@/);
  });

  it('does not invent a user_id for anonymous visitors', () => {
    tracking.clearUserId();

    expect(getTestGlobal().window?.dataLayer).toEqual([]);
  });

  it('clears user_id after it was set', () => {
    tracking.setUserId(userId);
    tracking.clearUserId();

    expect(getTestGlobal().window?.dataLayer).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ user_id: userId }),
        expect.objectContaining({ user_id: null }),
      ]),
    );
  });
});
