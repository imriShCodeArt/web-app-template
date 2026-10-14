import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { hasBlockingOnboardingPrompt } from '@/lib/account/hasBlockingOnboardingPrompt';

function jsonResponse(body: unknown, ok = true): Response {
  return {
    ok,
    json: async () => body,
  } as Response;
}

describe('hasBlockingOnboardingPrompt', () => {
  const fetchMock = vi.fn();
  let legalNeeded = false;
  let marketingNeeded = false;

  beforeEach(() => {
    legalNeeded = false;
    marketingNeeded = false;
    fetchMock.mockReset();
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('legal-prompt-status')) {
        return jsonResponse({ needsPrompt: legalNeeded });
      }
      if (url.includes('marketing-prompt-status')) {
        return jsonResponse({ needsPrompt: marketingNeeded });
      }
      return jsonResponse({ needsPrompt: false });
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('is false when neither legal nor marketing prompt is needed', async () => {
    await expect(hasBlockingOnboardingPrompt()).resolves.toBe(false);
  });

  it('is true while the legal prompt is still needed', async () => {
    legalNeeded = true;
    await expect(hasBlockingOnboardingPrompt()).resolves.toBe(true);
  });

  it('is true while the marketing prompt is still needed', async () => {
    marketingNeeded = true;
    await expect(hasBlockingOnboardingPrompt()).resolves.toBe(true);
  });

  it('is true when the status request fails', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    await expect(hasBlockingOnboardingPrompt()).resolves.toBe(true);
  });
});
