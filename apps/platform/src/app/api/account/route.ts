import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { auth } from '@template/auth/server';
import { db, users } from '@template/db';

export async function DELETE() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json(
      { code: 'UNAUTHORIZED' as const },
      { status: 401 },
    );
  }

  await db.delete(users).where(eq(users.id, userId));

  return NextResponse.json({ ok: true as const });
}
