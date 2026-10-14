import { and, eq, gt, isNull } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { defaultLocale } from '@template/i18n';
import { db, emailVerificationTokens, users } from '@template/db';

function homeUrl(locale: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? '';
  if (locale === defaultLocale) {
    return `${base}/`;
  }
  return `${base}/${locale}/`;
}

/**
 * GET /api/auth/verify-email?token=...
 * Magic-link handler: verifies the token, marks the user as verified, and
 * redirects them to the home page.
 */
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token')?.trim();

  if (!token) {
    return NextResponse.redirect(
      new URL('/auth-error?error=verification', request.url),
    );
  }

  const now = new Date();

  const [row] = await db
    .select({
      id: emailVerificationTokens.id,
      userId: emailVerificationTokens.userId,
      usedAt: emailVerificationTokens.usedAt,
      expires: emailVerificationTokens.expires,
    })
    .from(emailVerificationTokens)
    .where(
      and(
        eq(emailVerificationTokens.token, token),
        gt(emailVerificationTokens.expires, now),
        isNull(emailVerificationTokens.usedAt),
      ),
    )
    .limit(1);

  if (!row) {
    return NextResponse.redirect(
      new URL('/auth-error?error=verification', request.url),
    );
  }

  const [userRow] = await db
    .select({ locale: users.locale })
    .from(users)
    .where(eq(users.id, row.userId))
    .limit(1);

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ emailVerified: now })
      .where(and(eq(users.id, row.userId), isNull(users.emailVerified)));

    await tx
      .update(emailVerificationTokens)
      .set({ usedAt: now })
      .where(eq(emailVerificationTokens.id, row.id));
  });

  const locale = userRow?.locale ?? defaultLocale;
  const redirectTo = homeUrl(locale) + '?verified=1';
  return NextResponse.redirect(new URL(redirectTo, request.url));
}

const otpSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.string().email()),
  otp: z.string().trim().length(6),
});

/**
 * POST /api/auth/verify-email
 * OTP handler: verifies the 6-digit code and marks the user as verified.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const parsed = otpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { email, otp } = parsed.data;
    const now = new Date();

    const [row] = await db
      .select({
        id: emailVerificationTokens.id,
        userId: emailVerificationTokens.userId,
      })
      .from(emailVerificationTokens)
      .where(
        and(
          eq(emailVerificationTokens.email, email),
          eq(emailVerificationTokens.otp, otp),
          gt(emailVerificationTokens.expires, now),
          isNull(emailVerificationTokens.usedAt),
        ),
      )
      .limit(1);

    if (!row) {
      return NextResponse.json(
        { error: 'Invalid or expired code' },
        { status: 422 },
      );
    }

    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({ emailVerified: now })
        .where(and(eq(users.id, row.userId), isNull(users.emailVerified)));

      await tx
        .update(emailVerificationTokens)
        .set({ usedAt: now })
        .where(eq(emailVerificationTokens.id, row.id));
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[api/auth/verify-email]', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
