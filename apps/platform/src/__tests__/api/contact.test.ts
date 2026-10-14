/**
 * Tests for POST /api/contact.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchMock = vi.fn(() =>
  Promise.resolve(
    new Response(JSON.stringify({ id: 'email-123' }), { status: 200 }),
  ),
);
vi.stubGlobal('fetch', fetchMock);

vi.mock('@/lib/server-env', () => ({
  serverEnv: {
    RESEND_API_KEY: 'test-key',
    CONTACT_FROM_EMAIL: 'test@example.com',
    CONTACT_TO_EMAIL: undefined,
  },
}));

const { POST } = await import('@/app/api/contact/route');

const validBody = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  phone: '+972521234567',
};

function makeRequest(body = validBody) {
  return new Request('http://localhost/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/contact', () => {
  beforeEach(() => {
    fetchMock.mockClear();
  });

  it('sends the contact email', async () => {
    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('returns 400 for an invalid request body', async () => {
    const res = await POST(
      makeRequest({ name: '', email: 'not-an-email', phone: '123' }),
    );
    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
