'use client';

import Script from 'next/script';
import { useSession } from 'next-auth/react';

import { AnalyticsPageContext } from '@/components/cookies/AnalyticsPageContext';
import { buildConsentModeBootstrapScript } from '@/lib/tracking/consentMode';
import {
  buildAnalyticsContextBootstrapScript,
  isAnalyticsUserId,
} from '@/lib/tracking/sanitizeAnalyticsPath';

/** Set in `.env` — loaded on eligible pages with Consent Mode v2 (defaults denied). */
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID?.trim();

function buildGtmLoaderScript(gtmId: string, userId?: string): string {
  return `${buildConsentModeBootstrapScript()}${buildAnalyticsContextBootstrapScript(userId)}
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`;
}

/**
 * Loads Google Tag Manager on eligible public pages with Advanced Consent Mode v2.
 * Consent defaults (`analytics_storage`, `ad_storage`, `ad_user_data`,
 * `ad_personalization`) are denied for new visitors and restored from
 * persisted cookie choices before `gtm.js` runs.
 *
 * `page_path`, `page_location`, `page_title`, and `page_referrer` are sanitized
 * before GTM loads (UUIDs masked, auth/PII query keys dropped, hashes stripped,
 * generic titles on /audit/:id and /share/:id). The initial document load
 * uses that bootstrap context only. SPA navigations emit one
 * `cw_analytics_page_ready` event after the destination URL is current and
 * the analytics title is ready (title mutation or path-derived titles), with
 * `page_referrer` set to the previous sanitized `page_location`.
 * Authenticated `users.id` is exposed as `user_id` when the session is known.
 */
export function ConsentAwareGtm() {
  const { data: session } = useSession();
  const analyticsUserId = isAnalyticsUserId(session?.user?.id)
    ? session.user.id
    : undefined;

  if (!GTM_ID) {
    return null;
  }

  return (
    <>
      <AnalyticsPageContext />
      <Script
        id="google-tag-manager"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: buildGtmLoaderScript(GTM_ID, analyticsUserId),
        }}
      />
    </>
  );
}
