import { createNavigation } from 'next-intl/navigation';
import type { defineRouting } from 'next-intl/routing';

type Routing = ReturnType<typeof defineRouting>;

/**
 * Thin wrapper around `next-intl`'s `createNavigation` so each app can
 * derive locale-aware `Link`/`redirect`/`usePathname`/etc. from its own
 * `routing` config (pathnames are app-specific).
 *
 * Intentionally has no `'use client'` directive: this factory is called at
 * module scope from server-safe code (e.g. server components, middleware).
 * Apps that want a prefetch-disabled `Link` wrapper should build it locally
 * as a small client component (see `apps/platform/src/i18n/AppLink.tsx`),
 * since a function exported from a client module cannot be invoked from a
 * server module — only rendered as a component.
 */
export function createLocaleNavigation<R extends Routing>(routing: R) {
  return createNavigation(routing);
}
