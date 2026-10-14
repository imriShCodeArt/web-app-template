import { db, users } from '@template/db';
import { eq } from 'drizzle-orm';

type UserVerificationRow = {
  password: string | null;
  emailVerified: Date | null;
};

/** Manual email+password signup (not Google OAuth). */
export function isCredentialsSignupUser(row: UserVerificationRow): boolean {
  return row.password !== null;
}

/** Credentials users must complete OTP / magic-link verification before app access. */
export function userRequiresEmailVerification(
  row: UserVerificationRow,
): boolean {
  return isCredentialsSignupUser(row) && row.emailVerified === null;
}

export async function getUserVerificationState(userId: string) {
  const [row] = await db
    .select({
      password: users.password,
      emailVerified: users.emailVerified,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return row ?? null;
}

export async function userIdRequiresEmailVerification(
  userId: string,
): Promise<boolean> {
  const row = await getUserVerificationState(userId);
  if (!row) return false;
  return userRequiresEmailVerification(row);
}
