import 'next-auth';
import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    /** Present when the JWT is valid and the user row still exists. */
    user?: {
      id: string;
      role: string;
      /** Null for unverified email/password accounts; set for OAuth and verified accounts. */
      emailVerified: Date | null;
    } & NonNullable<DefaultSession['user']>;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;
    name?: string | null;
    email?: string | null;
    picture?: string | null;
  }
}
