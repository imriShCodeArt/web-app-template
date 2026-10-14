import { describe, expect, it } from 'vitest';

import {
  accountHref,
  accountTabIndexFromQuery,
  accountTabQueryFromIndex,
} from '@/lib/account/accountTabQuery';

describe('accountTabQuery', () => {
  it('maps named tabs to panel indexes', () => {
    expect(accountTabIndexFromQuery(null)).toBe(0);
    expect(accountTabIndexFromQuery('profile')).toBe(0);
    expect(accountTabIndexFromQuery('settings')).toBe(1);
    expect(accountTabIndexFromQuery('unknown')).toBe(0);
  });

  it('keeps query strings stable when converting indexes', () => {
    expect(accountTabQueryFromIndex(0)).toBe('profile');
    expect(accountTabQueryFromIndex(1)).toBe('settings');
    expect(accountHref('settings')).toBe('/account?tab=settings');
  });
});
