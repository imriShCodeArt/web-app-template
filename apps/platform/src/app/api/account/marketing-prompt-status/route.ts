import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { auth } from '@template/auth/server';
import { db, users } from '@template/db';

/**
 * OAuth sign-in skips the email sign-up form, so `marketing_consent_updated_at` may be unset.
 * Used to show a one-time marketing preference dialog (see MarketingPreferencePrompt).
 * Wait until required legal acceptance is recorded so prompts do not stack.
 */
export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ needsPrompt: false as const });
  }

  const [row] = await db
    .select({
      marketingConsentUpdatedAt: users.marketingConsentUpdatedAt,
      termsAcceptedAt: users.termsAcceptedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!row) {
    return NextResponse.json({ needsPrompt: false as const });
  }

  const needsPrompt =
    row.termsAcceptedAt != null && row.marketingConsentUpdatedAt == null;
  return NextResponse.json({ needsPrompt });
}
