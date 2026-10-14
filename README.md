# Web app template

A reusable Next.js app skeleton with a bilingual shell (Hebrew and English, RTL and LTR), MUI, authentication, an account page, a contact form, and placeholder legal pages.

This repo is a Turborepo monorepo:

| Path              | Purpose                                           |
| ----------------- | ------------------------------------------------- |
| `apps/platform`   | The Next.js app (port 3000)                       |
| `packages/db`     | Drizzle schema, client, and migrations            |
| `packages/auth`   | Auth.js config, passwords, and email verification |
| `packages/ui`     | MUI theme and direction                           |
| `packages/i18n`   | Locales and next-intl navigation helpers          |
| `packages/config` | Site config and public env validation             |

Copy this repository when starting a new app, then replace the placeholder name, copy, and pages.

## Stack

- Next.js App Router
- React and TypeScript
- MUI
- next-intl (Hebrew default, English)
- Auth.js (Google and email/password)
- Drizzle ORM and Neon Postgres

## Getting started

```bash
yarn install
cp apps/platform/.env.example apps/platform/.env.local
```

Set at least:

| Variable                                | Purpose                                            |
| --------------------------------------- | -------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                  | Public origin, for example `http://localhost:3000` |
| `NEON_DATABASE_URL` or `DATABASE_URL`   | Pooled Postgres URL                                |
| `AUTH_SECRET`                           | Random secret (`openssl rand -base64 32`)          |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth client                                |

Google redirect URI for local development: `http://localhost:3000/api/auth/callback/google`.

Then:

```bash
yarn db:migrate
yarn dev
```

## Scripts

```bash
yarn dev
yarn build
yarn lint
yarn typecheck
yarn test
yarn validate
```

## Branching

Feature branches start from `preview`. Open pull requests against `preview`. Promote to production with a `preview` → `main` pull request. See [`.github/BRANCHING.md`](.github/BRANCHING.md).
