/** Maps `/account?tab=` values to AccountTabs panel index. */
export function accountTabIndexFromQuery(
  tab: string | null | undefined,
): number {
  switch (tab) {
    case 'settings':
      return 1;
    case 'profile':
    case 'details':
    default:
      return 0;
  }
}

export type AccountTabQuery = 'profile' | 'settings';

export function accountTabQueryFromIndex(index: number): AccountTabQuery {
  switch (index) {
    case 1:
      return 'settings';
    default:
      return 'profile';
  }
}

export function accountHref(
  tab: AccountTabQuery,
): `/account?tab=${AccountTabQuery}` {
  return `/account?tab=${tab}`;
}
