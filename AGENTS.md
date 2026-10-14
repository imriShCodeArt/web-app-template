<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `apps/platform/node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# AGENTS.md

## Project purpose

This repository is a reusable Next.js web app template.

Keep the template generic, clean, and reusable across multiple future web apps. Do not add client-specific business logic, branding, copy, or domain-specific features directly into the template unless explicitly requested.

## Tech stack

- Next.js App Router
- React
- TypeScript
- Yarn
- MUI
- next-intl
- ESLint
- Prettier
- GitHub Actions

## Package manager

Use Yarn only.

Preferred commands:

```bash
yarn install
yarn dev
yarn build
yarn lint
yarn format
yarn format:check
yarn typecheck
yarn validate
```

Do not use npm, pnpm, or bun unless the project owner explicitly changes the package manager.

## Architecture rules

This repository is a **Turborepo monorepo** (Yarn workspaces). Run commands from the repository root unless noted otherwise.

```txt
apps/
  platform/   # Next.js app (shell, auth, account, placeholder pages)
packages/     # Shared packages (@template/db, auth, ui, i18n, config)
turbo.json
package.json  # Workspace root
```

Active Next.js apps live under `apps/*/`. Use the `src/` directory inside each app.

`apps/platform` expected structure:

```txt
apps/platform/src/
  app/
  components/
  config/
  i18n/
  lib/
  messages/
  styles/
```

Keep reusable UI components in:

```txt
apps/platform/src/components/ui/
```

Keep app shell components in:

```txt
apps/platform/src/components/shell/
```

Keep global providers in:

```txt
apps/platform/src/components/providers/
```

Keep project-level constants and configuration in:

```txt
apps/platform/src/config/
```

Keep shared utilities in:

```txt
apps/platform/src/lib/
```

## App Router page conventions

Keep `src/app/[locale]/**/page.tsx` files thin. Put UI in `src/components/<feature>/`.

### Shared types (`@/lib/page`)

- `LocalePageProps` — standard `{ params: Promise<{ locale: string }> }`
- `LocaleSearchPageProps` — adds typed `searchParams`
- `LocaleDynamicPageProps<'slug' | 'id'>` — dynamic segments

### Metadata

Use `createLocalePageMetadata` in `generateMetadata` for typical i18n title/description pages. Pass `private: true` for authenticated routes. Override `titleKey` / `descriptionKey` when the namespace uses non-default keys (e.g. `auth.account`).

### Page shells (`@/components/page`)

| Shell               | Use for                                                                                                   |
| ------------------- | --------------------------------------------------------------------------------------------------------- |
| `LocalePageView`    | Public marketing/legal pages: optional JSON-LD + body (often feature components or `PageHero` + sections) |
| `ContainerPageView` | Authenticated or utility pages: regulated `Container` `layout` (`wide`, `loose`, `page`, …)               |

Breadcrumbs: `buildHomeBreadcrumbJsonLd(locale, navT('home'), [{ name, path }])` inside `LocalePageView` `jsonLd`.

### Layout presets (`@/config/page-content.ts`)

Use `Container` `layout` on body shells — not in every `page.tsx`. Heroes use `PageHero`; long-form docs use shell components with `layout="document"`.

### Example (marketing)

```tsx
export async function generateMetadata({ params }: LocalePageProps) {
  return createLocalePageMetadata({
    params,
    path: '/about',
    namespace: 'pages.about',
  });
}

export default async function AboutPage({ params }: LocalePageProps) {
  const { locale, t, navT } = await getLocalePageContext(params, 'pages.about');
  return (
    <LocalePageView
      jsonLd={buildHomeBreadcrumbJsonLd(locale, navT('home'), [
        { name: navT('about'), path: '/about' },
      ])}
    >
      <AboutHero />
      <AboutContent t={t} />
    </LocalePageView>
  );
}
```

## Styling rules

Use MUI for UI components and theming.

Do not introduce another component library unless explicitly requested.

Prefer theme-driven styling over hardcoded values where practical.

Support both LTR and RTL layouts. Hebrew should remain RTL-compatible.

## i18n rules

Use `next-intl`.

Supported locales are configured in:

```txt
src/config/i18n.ts
```

Translations live in:

```txt
src/messages/en.json
src/messages/he.json
```

Do not hardcode visible UI text inside components when that text should be translated.

Use translation keys for navigation, shell text, buttons, page titles, form labels, error messages, and common UI labels.

## TypeScript rules

Use strict TypeScript.

Avoid `any` unless there is a strong reason.

Prefer explicit types for exported functions, config objects, and reusable components.

Use the `@/*` alias for imports from `src`.

Example:

```ts
import { siteConfig } from '@/config/site';
```

## Code quality

Before completing a change, run:

```bash
yarn validate
```

If the full validation is too expensive during development, run the relevant subset:

```bash
yarn typecheck
yarn lint
yarn format:check
```

## Formatting

Prettier owns formatting.

Do not add ESLint rules that conflict with Prettier.

## GitHub Actions

Keep CI simple and template-friendly.

The default validation workflow should install dependencies and run:

```bash
yarn validate
```

## Environment variables

Public environment variables must use the `NEXT_PUBLIC_` prefix.

Do not commit secrets.

Keep `.env.example` updated when adding required environment variables.

Validate environment variables in `src/lib/env.ts` when they are required by the app.

## Template-specific behavior

When adding features, prefer generic names and reusable examples.

Good examples:

```txt
AppShell
MainNav
siteConfig
ContactForm
```

Avoid client-specific names in the template:

```txt
ClientDashboard
FlorageCheckout
AccessibilityScannerForBusinessX
```

Client-specific features belong in apps created from this template, not in the template itself.

## Dependency policy

Do not add dependencies casually.

Before adding a dependency, prefer:

1. Built-in Next.js and React APIs
2. Existing project utilities
3. Existing installed libraries
4. A new dependency only when clearly justified

When adding a dependency, make sure it is useful for a reusable template and not only for one specific future app.

## Accessibility

Components should be accessible by default.

Use semantic HTML where possible.

Buttons must be buttons, links must be links, and interactive elements need clear labels.

Forms should use associated labels, helpful validation messages, and keyboard-accessible controls.

Avoid removing focus states unless replacing them with an accessible alternative.

## Security

Do not commit secrets, private tokens, API keys, or credentials.

Do not expose server-only values through `NEXT_PUBLIC_*`.

Validate user input at boundaries where relevant.

Prefer safe defaults for external links, forms, and environment variables.

## Documentation

Update `README.md` when setup steps, commands, environment variables, or architectural conventions change.

Keep examples concise and generic.

## Git workflow

This repo uses **preview → production** promotion (see [`.github/BRANCHING.md`](.github/BRANCHING.md)):

- Create branches as **`feature/*`** from **`preview`**
- Open PRs against **`preview`** only (never against `main` for feature work)
- Release to production with a **`preview` → `main`** PR only
- Do not push directly to **`main`** or **`preview`**; the only exception is
  the guarded post-release fast-forward in
  `.github/workflows/sync-preview-after-release.yml`

Release PRs to `main` are guarded by `.github/workflows/main-source-guard.yml` (required status: `main-source-branch`).

## Agent behavior

When modifying this repo:

1. Preserve the template’s reusable nature.
2. Prefer small, focused changes.
3. Keep the folder structure consistent.
4. Keep UI text i18n-ready.
5. Keep Hebrew and RTL support working.
6. Avoid unnecessary dependencies.
7. Update documentation when behavior changes.
8. Run validation before finalizing changes.
