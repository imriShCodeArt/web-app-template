import { and, eq, isNotNull, isNull } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { db, passwordResetTokens, users } from '@template/db';

import { sendPasswordResetEmail } from '@/lib/email/send-password-reset-email';

const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.string().email()),
});

/**
 * POST /api/auth/forgot-password
 * Creates a one-hour reset token for credentials users and emails the link.
 * Always returns 200 to prevent email enumeration (unknown / Google-only accounts).
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
      })
      .from(users)
      .where(and(eq(users.email, email), isNotNull(users.password)))
      .limit(1);

    if (!user) {
      return NextResponse.json({ success: true });
    }

    await db
      .delete(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.userId, user.id),
          isNull(passwordResetTokens.usedAt),
        ),
      );

    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token,
      expires,
    });

    await sendPasswordResetEmail({
      to: email,
      name: user.name,
      token,
      locale: user.locale,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[api/auth/forgot-password]', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
