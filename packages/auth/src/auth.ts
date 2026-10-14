import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { PENDING_WEBSITE_PLACEHOLDER } from '@template/config';
import {
  accounts,
  authenticators,
  db,
  sessions,
  users,
  verificationTokens,
} from '@template/db';
import { and, eq, isNull } from 'drizzle-orm';
import { cookies, headers } from 'next/headers';
import NextAuth, { type Session } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { z } from 'zod';

import { GOOGLE_AUTHORIZATION_PARAMS } from './googleAuthorizationParams';

import {
  OAUTH_AUTH_OUTCOME_COOKIE,
  parseOAuthAuthOutcome,
} from './oauthAuthOutcome';
import {
  applyOAuthSignupLegalAcceptance,
  OAUTH_SIGNUP_CONSENT_COOKIE,
  oauthSignupConsentCookieOptions,
  parseOAuthSignupConsent,
} from './oauthSignupConsent';
import { verifyPassword } from './password';

// Resolve AUTH_URL for OAuth redirects: prefer explicit AUTH_URL, then public site URL,
// then NEON_AUTH_BASE_URL (must be your deployed app origin, not the Neon console).
function bootstrapAuthUrl() {
  if (process.env.AUTH_URL?.trim()) return;
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const neonAuth = process.env.NEON_AUTH_BASE_URL?.trim();
  if (site?.startsWith('http')) {
    process.env.AUTH_URL = site;
    return;
  }
  if (neonAuth?.startsWith('http')) {
    process.env.AUTH_URL = neonAuth;
  }
}

bootstrapAuthUrl();

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const authCookieDomain = process.env.AUTH_COOKIE_DOMAIN?.trim() || undefined;
const useSecureCookies = (
  process.env.AUTH_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  ''
).startsWith('https://');

/**
 * Optional shared cookie domain (e.g. `.example.com`) so apps on sibling
 * subdomains can read the same Auth.js session JWT. Requires the same
 * `AUTH_SECRET` in each app. Leave unset for localhost (host-only cookies).
 */
function sharedAuthCookies() {
  if (!authCookieDomain) return undefined;
  const base = {
    domain: authCookieDomain,
    path: '/',
    sameSite: 'lax' as const,
    secure: useSecureCookies,
  };
  const prefix = useSecureCookies ? '__Secure-' : '';
  return {
    sessionToken: {
      name: `${prefix}authjs.session-token`,
      options: { ...base, httpOnly: true },
    },
    callbackUrl: {
      name: `${prefix}authjs.callback-url`,
      options: base,
    },
    csrfToken: {
      name: `${useSecureCookies ? '__Host-' : ''}authjs.csrf-token`,
      // CSRF cookie cannot use Domain with __Host-; keep host-only when secure.
      options: useSecureCookies
        ? { path: '/', sameSite: 'lax' as const, secure: true, httpOnly: true }
        : { ...base, httpOnly: true },
    },
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
    authenticatorsTable: authenticators,
  }),
  trustHost: true,
  // JWT cookie keeps claims until expiry; removing the DB row does not revoke it.
  // The session callback checks the user still exists so deleted accounts log out.
  session: { strategy: 'jwt' },
  cookies: sharedAuthCookies(),
  pages: {
    signIn: '/sign-in',
    // Avoid default /api/auth/error handling — that path is not a supported Auth
    // action in v5 and throws UnknownAction in the App Router catch-all.
    error: '/auth-error',
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? '',
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? '',
      authorization: {
        params: GOOGLE_AUTHORIZATION_PARAMS,
      },
    }),
    Credentials({
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' },
      },
      async authorize(credentials) {
        const parsed = signInSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const email = parsed.data.email.trim().toLowerCase();
        const { password } = parsed.data;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!user?.password) return null;

        const valid = await verifyPassword(password, user.password);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.sub = user.id;
        token.role = (user as typeof user & { role?: string }).role ?? 'user';
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }
      if (trigger === 'update' && session?.user) {
        const nextUser = session.user;
        if (nextUser.name !== undefined) {
          token.name = nextUser.name;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (!token.sub) return session;

      const [row] = await db
        .select({
          id: users.id,
          role: users.role,
          emailVerified: users.emailVerified,
        })
        .from(users)
        .where(eq(users.id, token.sub))
        .limit(1);

      if (!row) {
        return { ...session, user: undefined };
      }

      const user: NonNullable<Session['user']> = {
        ...(session.user ?? {}),
        id: token.sub,
        name: (token.name as string | null | undefined) ?? null,
        email: (token.email as string | null | undefined) ?? null,
        image: (token.picture as string | null | undefined) ?? null,
        // Always trust the persisted DB role for authorization decisions.
        role: row.role,
        // Always read from DB so verification is reflected without re-login.
        emailVerified: row.emailVerified ?? null,
      };
      return { ...session, user };
    },
  },
  events: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.id) {
        const now = new Date();
        await db
          .update(users)
          .set({ emailVerified: now, updatedAt: now })
          .where(and(eq(users.id, user.id), isNull(users.emailVerified)));

        // Existing Google accounts created before a website was known still
        // have the placeholder; apply the scan-widget URL if present.
        try {
          const cookieStore = await cookies();
          if (
            parseOAuthAuthOutcome(
              cookieStore.get(OAUTH_AUTH_OUTCOME_COOKIE)?.value,
            ) !== 'sign_up'
          ) {
            cookieStore.set(
              OAUTH_AUTH_OUTCOME_COOKIE,
              'login',
              oauthSignupConsentCookieOptions(useSecureCookies),
            );
          }
          const consent = parseOAuthSignupConsent(
            cookieStore.get(OAUTH_SIGNUP_CONSENT_COOKIE)?.value,
          );
          if (consent?.website) {
            await db
              .update(users)
              .set({ website: consent.website, updatedAt: now })
              .where(
                and(
                  eq(users.id, user.id),
                  eq(users.website, PENDING_WEBSITE_PLACEHOLDER),
                ),
              );
          }
        } catch (err) {
          console.error('[auth] Failed to apply OAuth pending website', err);
        }
      }
    },
    async createUser(message) {
      const id = message.user.id;
      if (!id) return;
      const fallbackName =
        message.user.name?.trim() ||
        message.user.email?.split('@')[0]?.trim() ||
        'User';

      // Google signup stores terms + optional website in a short-lived cookie.
      let consent: ReturnType<typeof parseOAuthSignupConsent> = null;
      try {
        const cookieStore = await cookies();
        consent = parseOAuthSignupConsent(
          cookieStore.get(OAUTH_SIGNUP_CONSENT_COOKIE)?.value,
        );
      } catch (err) {
        console.error('[auth] Failed to read OAuth signup cookie', err);
      }

      await db
        .update(users)
        .set({
          name: fallbackName,
          website: consent?.website || PENDING_WEBSITE_PLACEHOLDER,
          locale: 'he',
          updatedAt: new Date(),
        })
        .where(eq(users.id, id));

      try {
        const outcomeStore = await cookies();
        outcomeStore.set(
          OAUTH_AUTH_OUTCOME_COOKIE,
          'sign_up',
          oauthSignupConsentCookieOptions(useSecureCookies),
        );
      } catch (err) {
        console.error('[auth] Failed to record OAuth sign-up outcome', err);
      }

      if (!consent) return;

      try {
        if (consent.acceptTerms) {
          const headerStore = await headers();
          const forwarded = headerStore.get('x-forwarded-for');
          const ipAddress =
            forwarded?.split(',')[0]?.trim() ||
            headerStore.get('x-real-ip') ||
            null;
          const userAgent = headerStore.get('user-agent');
          await applyOAuthSignupLegalAcceptance({
            userId: id,
            marketingConsent: consent.marketingConsent,
            source: 'oauth_signup',
            ipAddress,
            userAgent,
          });
        }
        const cookieStore = await cookies();
        cookieStore.delete({
          name: OAUTH_SIGNUP_CONSENT_COOKIE,
          path: '/',
        });
      } catch (err) {
        console.error(
          '[auth] Failed to apply OAuth signup legal acceptance',
          err,
        );
      }
    },
  },
});
