import {
  OAUTH_SIGNUP_CONSENT_COOKIE,
  oauthSignupConsentCookieOptions,
  serializeOAuthSignupConsent,
} from '@template/auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { parseWebsiteUrl } from '@/lib/account/parseWebsiteUrl';

const bodySchema = z.object({
  acceptTerms: z.literal(true).optional(),
  marketingConsent: z.boolean().optional().default(false),
  website: z.string().max(2048).optional(),
});

/**
 * Stores a short-lived cookie so Auth.js `createUser` can record terms/privacy
 * (and marketing) and optionally the scan-widget website after Google OAuth.
 */
export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const websiteRaw = parsed.data.website?.trim();
  let website: string | undefined;
  if (websiteRaw) {
    const web = parseWebsiteUrl(websiteRaw);
    if (!web.ok) {
      return NextResponse.json({ error: 'Invalid website' }, { status: 400 });
    }
    website = web.normalized;
  }

  if (!parsed.data.acceptTerms && !website) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const secure = (
    process.env.AUTH_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    ''
  ).startsWith('https://');

  const response = NextResponse.json({ ok: true as const });
  response.cookies.set(
    OAUTH_SIGNUP_CONSENT_COOKIE,
    serializeOAuthSignupConsent({
      ...(parsed.data.acceptTerms ? { acceptTerms: true as const } : {}),
      marketingConsent: parsed.data.marketingConsent,
      ...(website ? { website } : {}),
    }),
    oauthSignupConsentCookieOptions(secure),
  );
  return response;
}
