import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next/headers so cookies() returns a fake jar with a Cookie value.
vi.mock('next/headers', () => ({
  cookies: async () => ({ toString: () => 'tj_token=abc123; jm_employer_token=xyz' }),
}));

import { serverFetch, ServerFetchError } from '@/lib/server-fetch';

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as unknown as Response;
}

describe('serverFetch', () => {
  beforeEach(() => vi.unstubAllGlobals());

  it('forwards the whole cookie jar as a Cookie header and returns JSON on 2xx', async () => {
    const fetchMock = vi.fn((_url: string, _init?: RequestInit) => Promise.resolve(jsonResponse(200, { ok: true })));
    vi.stubGlobal('fetch', fetchMock);

    const data = await serverFetch<{ ok: boolean }>('/seeker/me');
    expect(data.ok).toBe(true);

    const init = fetchMock.mock.calls[0][1];
    const headers = (init?.headers ?? {}) as Record<string, string>;
    expect(headers.Cookie).toBe('tj_token=abc123; jm_employer_token=xyz');
  });

  it('throws a typed ServerFetchError (status + code) on non-2xx', async () => {
    vi.stubGlobal('fetch', vi.fn((_url: string, _init?: RequestInit) => Promise.resolve(jsonResponse(401, { code: 'UNAUTHENTICATED', error: 'nope' }))));

    const error = await serverFetch('/seeker/me').catch((caught) => caught);
    expect(error).toBeInstanceOf(ServerFetchError);
    expect((error as ServerFetchError).status).toBe(401);
    expect((error as ServerFetchError).code).toBe('UNAUTHENTICATED');
  });
});
