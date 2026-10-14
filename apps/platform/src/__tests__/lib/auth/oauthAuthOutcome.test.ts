import { describe, expect, it } from 'vitest';

import { parseOAuthAuthOutcome } from '@template/auth';

describe('parseOAuthAuthOutcome', () => {
  it('accepts sign_up and login only', () => {
    expect(parseOAuthAuthOutcome('sign_up')).toBe('sign_up');
    expect(parseOAuthAuthOutcome('login')).toBe('login');
    expect(parseOAuthAuthOutcome('email')).toBeNull();
    expect(parseOAuthAuthOutcome(undefined)).toBeNull();
  });
});
