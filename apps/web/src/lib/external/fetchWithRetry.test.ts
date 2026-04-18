import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { fetchWithRetry } from './fetchWithRetry';

function makeEconnresetError() {
  const cause = Object.assign(new Error('read ECONNRESET'), {
    code: 'ECONNRESET',
    errno: -104,
    syscall: 'read',
  });
  return Object.assign(new TypeError('fetch failed'), { cause });
}

describe('fetchWithRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('첫 시도 성공 시 한 번만 호출한다', async () => {
    const fetchMock = vi.fn(async () => new Response('ok', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const res = await fetchWithRetry('https://example.com');
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('ECONNRESET 발생 시 재시도하여 최종 성공한다', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(makeEconnresetError())
      .mockRejectedValueOnce(makeEconnresetError())
      .mockResolvedValue(new Response('ok', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const promise = fetchWithRetry('https://example.com', {}, { initialDelayMs: 10, backoffFactor: 2 });
    await vi.runAllTimersAsync();
    const res = await promise;

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('재시도 횟수 초과 시 마지막 에러를 throw한다', async () => {
    const fetchMock = vi.fn().mockRejectedValue(makeEconnresetError());
    vi.stubGlobal('fetch', fetchMock);

    const promise = fetchWithRetry(
      'https://example.com',
      {},
      { retries: 2, initialDelayMs: 1, backoffFactor: 2 },
    );
    const assertion = expect(promise).rejects.toThrow('fetch failed');
    await vi.runAllTimersAsync();
    await assertion;

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('재시도 불가능한 에러(AbortError 비-코드)는 즉시 throw한다', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('some unrelated error'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      fetchWithRetry('https://example.com', {}, { retries: 3, initialDelayMs: 1 }),
    ).rejects.toThrow('some unrelated error');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('503 응답은 재시도 후 성공 응답을 반환한다', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockResolvedValue(new Response('ok', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const promise = fetchWithRetry('https://example.com', {}, { initialDelayMs: 1, backoffFactor: 2 });
    await vi.runAllTimersAsync();
    const res = await promise;

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('4xx(비-재시도) 응답은 재시도 없이 그대로 반환한다', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('', { status: 404 }));
    vi.stubGlobal('fetch', fetchMock);

    const res = await fetchWithRetry('https://example.com');
    expect(res.status).toBe(404);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
