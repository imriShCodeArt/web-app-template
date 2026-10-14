import type { usePathname } from '@/i18n/routing';

type AppPathname = ReturnType<typeof usePathname>;

type RouteParams = Record<string, string | string[] | undefined>;

export type RouterReplaceHref = AppPathname;

/**
 * Maps `usePathname()` + route params to a value accepted by `router.replace`.
 */
export function getRouterReplaceTarget(
  pathname: AppPathname,
  params: RouteParams,
): RouterReplaceHref {
  void params;
  return pathname;
}
