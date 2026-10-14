import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { isLocale, type Locale } from '@template/i18n';
import {
  CURRENT_PRIVACY_VERSION,
  CURRENT_TERMS_VERSION,
} from '@template/config';
import { parseWebsiteUrl } from '@/lib/account/parseWebsiteUrl';
import { hashPassword } from '@template/auth';
import { db, emailVerificationTokens, userConsents, users } from '@template/db';

import { sendVerificationEmail } from '@/lib/email/send-verification-email';
import { getClientRequestMeta } from '@/lib/http/clientRequestMeta';

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const signUpSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().pipe(z.string().email()),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  website: z.string().min(1).max(2048),
  acceptTerms: z.literal(true),
  marketingConsent: z.boolean().optional().default(false),
  locale: z
    .string()
    .optional()
    .transform((s): Locale | undefined => {
      if (s === undefined) return undefined;
      return isLocale(s) ? s : undefined;
    }),
});

function postgresErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const maybe = error as { code?: unknown; cause?: unknown };
  if (typeof maybe.code === 'string') return maybe.code;
  if (maybe.cause !== undefined && maybe.cause !== null) {
    return postgresErrorCode(maybe.cause);
  }
  return undefined;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signUpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const {
      name,
      email,
      password,
      acceptTerms: _acceptTerms,
      marketingConsent,
      locale,
    } = parsed.data;
    void _acceptTerms;

    const web = parseWebsiteUrl(parsed.data.website);
    if (!web.ok) {
      return NextResponse.json(
        {
          error: 'Invalid website',
          details: { website: [web.reason] },
        },
        { status: 400 },
      );
    }

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 409 },
      );
    }

    const hashed = await hashPassword(password);
    const now = new Date();
    const { ipAddress, userAgent } = getClientRequestMeta(request);
    const effectiveLocale = locale ?? 'he';

    try {
      await db.transaction(async (tx) => {
        const [created] = await tx
          .insert(users)
          .values({
            name,
            email,
            password: hashed,
            website: web.normalized,
            locale: effectiveLocale,
            termsAcceptedAt: now,
            termsVersion: CURRENT_TERMS_VERSION,
            privacyAcceptedAt: now,
            privacyVersion: CURRENT_PRIVACY_VERSION,
            marketingConsent,
            marketingConsentAt: marketingConsent ? now : null,
            // Always set so email signups are not prompted again (OAuth users stay null until they confirm).
            marketingConsentUpdatedAt: now,
            marketingUnsubscribedAt: null,
          })
          .returning({ id: users.id });

        if (!created) {
          throw new Error('INSERT returned no row');
        }

        const uid = created.id;
        const consentBase = {
          ipAddress,
          userAgent,
        };
        await tx.insert(userConsents).values([
          {
            userId: uid,
            type: 'terms',
            granted: true,
            version: CURRENT_TERMS_VERSION,
            source: 'signup',
            ...consentBase,
          },
          {
            userId: uid,
            type: 'privacy_policy',
            granted: true,
            version: CURRENT_PRIVACY_VERSION,
            source: 'signup',
            ...consentBase,
          },
        ]);
        if (marketingConsent) {
          await tx.insert(userConsents).values({
            userId: uid,
            type: 'marketing_email',
            granted: true,
            source: 'signup',
            ...consentBase,
          });
        }
      });
    } catch (insertErr) {
      const code = postgresErrorCode(insertErr);
      if (code === '23505') {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 409 },
        );
      }
      throw insertErr;
    }

    const [row] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!row) {
      console.error('[api/auth/signup] Insert succeeded but user row missing');
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 },
      );
    }

    // Generate email verification token and send the verification email.
    const otp = generateOtp();
    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    try {
      await db.insert(emailVerificationTokens).values({
        userId: row.id,
        email: row.email,
        otp,
        token,
        expires,
      });

      await sendVerificationEmail({
        to: row.email,
        name: row.name,
        otp,
        token,
        locale: effectiveLocale,
      });
    } catch (emailErr) {
      // Non-fatal: user is created; they can request a resend from the verify page.
      console.error(
        '[api/auth/signup] Failed to send verification email',
        emailErr,
      );
    }

    return NextResponse.json({ user: row }, { status: 201 });
  } catch (error) {
    console.error('[api/auth/signup]', error);
    const code = postgresErrorCode(error);
    if (code === '42P01') {
      console.error(
        '[api/auth/signup] PostgreSQL 42P01: tables missing — run yarn db:migrate against this Neon database (same NEON_DATABASE_URL / NEON_POSTGRES_URL / DATABASE_URL as production; see README Deployment).',
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
