import { and, eq, gt, isNull } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { hashPassword } from '@template/auth';
import { db, passwordResetTokens, users } from '@template/db';

const bodySchema = z.object({
  token: z.string().trim().min(1),
  password: z.string().min(8),
});

/**
 * POST /api/auth/reset-password
 * Consumes a single-use reset token and sets a new password. Does not sign the user in.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { token, password } = parsed.data;
    const now = new Date();

    const [row] = await db
      .select({
        id: passwordResetTokens.id,
        userId: passwordResetTokens.userId,
      })
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          gt(passwordResetTokens.expires, now),
          isNull(passwordResetTokens.usedAt),
        ),
      )
      .limit(1);

    if (!row) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 422 },
      );
    }

    const hashed = await hashPassword(password);

    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({ password: hashed, updatedAt: now })
        .where(eq(users.id, row.userId));

      await tx
        .update(passwordResetTokens)
        .set({ usedAt: now })
        .where(eq(passwordResetTokens.id, row.id));

      await tx
        .delete(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.userId, row.userId),
            isNull(passwordResetTokens.usedAt),
          ),
        );
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[api/auth/reset-password]', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
