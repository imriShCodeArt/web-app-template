import {
  CURRENT_PRIVACY_VERSION,
  CURRENT_TERMS_VERSION,
} from '@template/config';
import { db, userConsents, users } from '@template/db';
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';

/** Short-lived cookie bridging SignUpForm → Auth.js `createUser` for Google. */
export const OAUTH_SIGNUP_CONSENT_COOKIE = 'cw_oauth_signup_consent';

const consentPayloadSchema = z.object({
  acceptTerms: z.literal(true).optional(),
  marketingConsent: z.boolean().optional().default(false),
  /** Normalized website URL from the scan widget / sign-up form. */
  website: z.string().max(2048).optional(),
});

export type OAuthSignupConsentPayload = z.infer<typeof consentPayloadSchema>;

export function serializeOAuthSignupConsent(
  payload: OAuthSignupConsentPayload,
): string {
  return JSON.stringify(payload);
}

export function parseOAuthSignupConsent(
  raw: string | undefined,
): OAuthSignupConsentPayload | null {
  if (!raw) return null;
  try {
    const parsed = consentPayloadSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function oauthSignupConsentCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure,
    path: '/',
    maxAge: 60 * 10, // 10 minutes — enough for the Google redirect round-trip
  };
}

type LegalAcceptanceMeta = {
  userId: string;
  source: string;
  ipAddress?: string | null;
  userAgent?: string | null;
};

/**
 * Persist required terms + privacy acceptance. Idempotent when already set.
 * Returns whether a new acceptance was recorded.
 */
export async function applyRequiredLegalAcceptance(
  args: LegalAcceptanceMeta,
): Promise<boolean> {
  const { userId, source, ipAddress = null, userAgent = null } = args;
  const now = new Date();

  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(users)
      .set({
        termsAcceptedAt: now,
        termsVersion: CURRENT_TERMS_VERSION,
        privacyAcceptedAt: now,
        privacyVersion: CURRENT_PRIVACY_VERSION,
        updatedAt: now,
      })
      .where(and(eq(users.id, userId), isNull(users.termsAcceptedAt)))
      .returning({ id: users.id });

    if (!updated) {
      return false;
    }

    const consentBase = { ipAddress, userAgent };
    await tx.insert(userConsents).values([
      {
        userId,
        type: 'terms',
        granted: true,
        version: CURRENT_TERMS_VERSION,
        source,
        ...consentBase,
      },
      {
        userId,
        type: 'privacy_policy',
        granted: true,
        version: CURRENT_PRIVACY_VERSION,
        source,
        ...consentBase,
      },
    ]);
    return true;
  });
}

/**
 * Persist terms/privacy + marketing choice for a newly created OAuth user
 * (SignUpForm Google path). Idempotent when terms are already set.
 */
export async function applyOAuthSignupLegalAcceptance(
  args: LegalAcceptanceMeta & { marketingConsent: boolean },
): Promise<boolean> {
  const {
    userId,
    marketingConsent,
    source,
    ipAddress = null,
    userAgent = null,
  } = args;
  const now = new Date();

  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(users)
      .set({
        termsAcceptedAt: now,
        termsVersion: CURRENT_TERMS_VERSION,
        privacyAcceptedAt: now,
        privacyVersion: CURRENT_PRIVACY_VERSION,
        marketingConsent,
        marketingConsentAt: marketingConsent ? now : null,
        marketingConsentUpdatedAt: now,
        updatedAt: now,
      })
      .where(and(eq(users.id, userId), isNull(users.termsAcceptedAt)))
      .returning({ id: users.id });

    if (!updated) {
      return false;
    }

    const consentBase = { ipAddress, userAgent };
    await tx.insert(userConsents).values([
      {
        userId,
        type: 'terms',
        granted: true,
        version: CURRENT_TERMS_VERSION,
        source,
        ...consentBase,
      },
      {
        userId,
        type: 'privacy_policy',
        granted: true,
        version: CURRENT_PRIVACY_VERSION,
        source,
        ...consentBase,
      },
    ]);
    if (marketingConsent) {
      await tx.insert(userConsents).values({
        userId,
        type: 'marketing_email',
        granted: true,
        source,
        ...consentBase,
      });
    }
    return true;
  });
}
