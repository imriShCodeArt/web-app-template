'use client';

import { signIn } from 'next-auth/react';

import { GOOGLE_AUTHORIZATION_PARAMS } from './googleAuthorizationParams';

export const GOOGLE_OAUTH_POPUP_MESSAGE_TYPE = 'cw-google-oauth';
export const GOOGLE_OAUTH_POPUP_CALLBACK_PATH = '/auth/oauth-popup';

export type GoogleOAuthPopupResult = {
  ok: boolean;
  error?: string;
};

type PopupMessage = {
  type: typeof GOOGLE_OAUTH_POPUP_MESSAGE_TYPE;
  ok: boolean;
  error?: string;
};

function isPopupMessage(data: unknown): data is PopupMessage {
  if (!data || typeof data !== 'object') return false;
  const value = data as Record<string, unknown>;
  return (
    value.type === GOOGLE_OAUTH_POPUP_MESSAGE_TYPE &&
    typeof value.ok === 'boolean'
  );
}

/** Tell the opener the Google flow finished, then close this window. */
export function notifyGoogleOAuthPopupOpener(
  result: GoogleOAuthPopupResult,
): boolean {
  if (typeof window === 'undefined') return false;
  if (!window.opener || window.opener.closed) return false;
  const message: PopupMessage = {
    type: GOOGLE_OAUTH_POPUP_MESSAGE_TYPE,
    ok: result.ok,
    ...(result.error ? { error: result.error } : {}),
  };
  window.opener.postMessage(message, window.location.origin);
  window.close();
  return true;
}

function openCenteredPopup(): Window | null {
  const width = 500;
  const height = 640;
  const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2);
  const top = Math.max(0, window.screenY + (window.outerHeight - height) / 2);
  return window.open(
    'about:blank',
    'cw-google-oauth',
    `popup=yes,width=${width},height=${height},left=${left},top=${top}`,
  );
}

function waitForPopup(popup: Window): Promise<GoogleOAuthPopupResult> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: GoogleOAuthPopupResult) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
      window.removeEventListener('message', onMessage);
      if (!popup.closed) popup.close();
      resolve(result);
    };

    const timeoutId = window.setTimeout(
      () => {
        finish({ ok: false, error: 'timeout' });
      },
      5 * 60 * 1000,
    );

    const intervalId = window.setInterval(() => {
      if (popup.closed) finish({ ok: false, error: 'cancelled' });
    }, 400);

    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (!isPopupMessage(event.data)) return;
      finish({ ok: event.data.ok, error: event.data.error });
    }

    window.addEventListener('message', onMessage);
  });
}

/**
 * Start Google OAuth in a popup so the original tab stays on this site.
 * Falls back to a full-page redirect if the browser blocks popups.
 */
export async function signInWithGooglePopup(options?: {
  popupCallbackUrl?: string;
  fallbackCallbackUrl?: string;
  /** Runs after the popup opens (keeps the click-gesture) and before Google. */
  beforeRedirect?: () => Promise<void>;
}): Promise<GoogleOAuthPopupResult> {
  const popupCallbackUrl =
    options?.popupCallbackUrl ?? GOOGLE_OAUTH_POPUP_CALLBACK_PATH;
  const fallbackCallbackUrl = options?.fallbackCallbackUrl ?? '/';

  const popup = openCenteredPopup();
  if (!popup) {
    if (options?.beforeRedirect) await options.beforeRedirect();
    await signIn(
      'google',
      { callbackUrl: fallbackCallbackUrl },
      GOOGLE_AUTHORIZATION_PARAMS,
    );
    return { ok: true };
  }

  try {
    if (options?.beforeRedirect) await options.beforeRedirect();
    const result = await signIn(
      'google',
      {
        redirect: false,
        callbackUrl: popupCallbackUrl,
      },
      GOOGLE_AUTHORIZATION_PARAMS,
    );

    if (!result?.url) {
      popup.close();
      return { ok: false, error: result?.error ?? 'configuration' };
    }

    popup.location.assign(result.url);
    return waitForPopup(popup);
  } catch (err) {
    popup.close();
    console.error('[auth] Google popup sign-in failed', err);
    return { ok: false, error: 'configuration' };
  }
}
