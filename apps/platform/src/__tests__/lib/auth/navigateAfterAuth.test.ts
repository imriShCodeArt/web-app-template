import { afterEach, describe, expect, it, vi } from 'vitest';

import { navigateAfterAuth } from '@/lib/auth/navigateAfterAuth';

describe('navigateAfterAuth', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reloads when the callback is the current path', () => {
    const reload = vi.fn();
    const assign = vi.fn();
    vi.stubGlobal('window', {
      location: {
        origin: 'http://localhost:3000',
        pathname: '/audit/scan-1',
        search: '',
        reload,
        assign,
      },
    });

    navigateAfterAuth('/audit/scan-1');
    expect(reload).toHaveBeenCalledOnce();
    expect(assign).not.toHaveBeenCalled();
  });

  it('assigns when the callback is a different path', () => {
    const reload = vi.fn();
    const assign = vi.fn();
    vi.stubGlobal('window', {
      location: {
        origin: 'http://localhost:3000',
        pathname: '/audit/scan-1',
        search: '',
        reload,
        assign,
      },
    });

    navigateAfterAuth('/account');
    expect(assign).toHaveBeenCalledWith('/account');
    expect(reload).not.toHaveBeenCalled();
  });
});
