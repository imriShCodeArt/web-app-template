import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { auth } from '@template/auth/server';
import { db, users } from '@template/db';

/**
 * OAuth (and legacy) accounts may lack terms/privacy acceptance.
 * Used to show a blocking dialog (see TermsAcceptancePrompt).
 */
export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ needsPrompt: false as const });
  }

  const [row] = await db
    .select({
      termsAcceptedAt: users.termsAcceptedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!row) {
    return NextResponse.json({ needsPrompt: false as const });
  }

  const needsPrompt = row.termsAcceptedAt == null;
  return NextResponse.json({ needsPrompt });
}
