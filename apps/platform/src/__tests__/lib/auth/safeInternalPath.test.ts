import { describe, expect, it } from 'vitest';

import { safeInternalPath } from '@/lib/auth/safeInternalPath';

describe('safeInternalPath', () => {
  it('accepts same-origin relative paths', () => {
    expect(safeInternalPath('/audit/abc')).toBe('/audit/abc');
    expect(safeInternalPath('/verify-email?email=a%40b.com')).toBe(
      '/verify-email?email=a%40b.com',
    );
  });

  it('rejects open redirects', () => {
    expect(safeInternalPath('https://evil.example/')).toBeNull();
    expect(safeInternalPath('//evil.example')).toBeNull();
    expect(safeInternalPath('/\\evil.example')).toBeNull();
    expect(safeInternalPath('audit/abc')).toBeNull();
    expect(safeInternalPath(null)).toBeNull();
  });
});
