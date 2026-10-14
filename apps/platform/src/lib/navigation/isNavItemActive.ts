/**
 * Whether a main-nav href matches the current pathname from `usePathname()` (locale stripped).
 */
export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === '/') {
    return pathname === '/';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
