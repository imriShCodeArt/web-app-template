import { and, eq, isNotNull, isNull } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { db, emailVerificationTokens, users } from '@template/db';

import { sendVerificationEmail } from '@/lib/email/send-verification-email';

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.string().email()),
});

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * POST /api/auth/resend-verification
 * Generates a fresh OTP + magic-link token for an unverified user and sends
 * a new verification email.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { email } = parsed.data;

    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        locale: users.locale,
        emailVerified: users.emailVerified,
      })
      .from(users)
      .where(
        and(
          eq(users.email, email),
          isNull(users.emailVerified),
          isNotNull(users.password),
        ),
      )
      .limit(1);

    // Always respond 200 to prevent email enumeration.
    if (!user) {
      return NextResponse.json({ success: true });
    }

    // Delete any existing unused tokens for this user.
    await db
      .delete(emailVerificationTokens)
      .where(eq(emailVerificationTokens.userId, user.id));

    const otp = generateOtp();
    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.insert(emailVerificationTokens).values({
      userId: user.id,
      email,
      otp,
      token,
      expires,
    });

    await sendVerificationEmail({
      to: email,
      name: user.name,
      otp,
      token,
      locale: user.locale,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[api/auth/resend-verification]', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
