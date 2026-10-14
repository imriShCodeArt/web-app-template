import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const AUTH_SRC = join(process.cwd(), '../../packages/auth/src');

describe('Google account picker', () => {
  it('requests select_account so Google does not reuse the last session silently', () => {
    const params = readFileSync(
      join(AUTH_SRC, 'googleAuthorizationParams.ts'),
      'utf8',
    );
    const provider = readFileSync(join(AUTH_SRC, 'auth.ts'), 'utf8');
    const popup = readFileSync(join(AUTH_SRC, 'googlePopup.ts'), 'utf8');

    expect(params).toContain("prompt: 'select_account'");
    expect(provider).toContain('params: GOOGLE_AUTHORIZATION_PARAMS');
    expect(popup).toContain('GOOGLE_AUTHORIZATION_PARAMS');
    expect(popup).toMatch(
      /signIn\(\s*'google',[\s\S]*GOOGLE_AUTHORIZATION_PARAMS/,
    );
  });
});
