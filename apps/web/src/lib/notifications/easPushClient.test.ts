import { afterEach, describe, expect, it, vi } from 'vitest';

import { chunkArray, sendEasPushNotifications } from './easPushClient';

describe('chunkArray', () => {
  it('빈 배열은 빈 배열을 반환한다', () => {
    expect(chunkArray([], 100)).toEqual([]);
  });

  it('size보다 작은 배열은 단일 청크를 반환한다', () => {
    expect(chunkArray([1, 2, 3], 100)).toEqual([[1, 2, 3]]);
  });

  it('정확히 size인 배열은 단일 청크를 반환한다', () => {
    const arr = Array.from({ length: 100 }, (_, i) => i);
    const result = chunkArray(arr, 100);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveLength(100);
  });

  it('250개 배열을 100 단위로 분할하면 [100, 100, 50] 청크가 된다', () => {
    const arr = Array.from({ length: 250 }, (_, i) => i);
    const result = chunkArray(arr, 100);
    expect(result).toHaveLength(3);
    expect(result[0]).toHaveLength(100);
    expect(result[1]).toHaveLength(100);
    expect(result[2]).toHaveLength(50);
  });
});

describe('sendEasPushNotifications', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('토큰이 없으면 fetch를 호출하지 않고 { successCount: 0, failureCount: 0 }을 반환한다', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch');

    const result = await sendEasPushNotifications([], '제목', '내용');

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result).toEqual({ successCount: 0, failureCount: 0 });
  });

  it('50개 토큰은 단일 EAS API 요청으로 발송한다', async () => {
    const tokens = Array.from({ length: 50 }, (_, i) => `ExponentPushToken[token-${i}]`);
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          data: tokens.map(() => ({ status: 'ok' })),
        }),
        { status: 200 },
      ),
    );

    const result = await sendEasPushNotifications(tokens, '제목', '내용');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result.successCount).toBe(50);
    expect(result.failureCount).toBe(0);
  });

  it('250개 토큰은 3번 EAS API를 호출한다', async () => {
    const tokens = Array.from({ length: 250 }, (_, i) => `ExponentPushToken[token-${i}]`);
    vi.spyOn(global, 'fetch').mockImplementation((_url, options) => {
      const body = JSON.parse((options as RequestInit).body as string) as Array<{ to: string }>;
      return Promise.resolve(
        new Response(
          JSON.stringify({ data: body.map(() => ({ status: 'ok' })) }),
          { status: 200 },
        ),
      );
    });

    const result = await sendEasPushNotifications(tokens, '제목', '내용');

    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(result.successCount).toBe(250);
    expect(result.failureCount).toBe(0);
  });

  it('EAS API가 일부 토큰에 error 상태를 반환하면 failureCount에 반영한다', async () => {
    const tokens = ['ExponentPushToken[ok]', 'ExponentPushToken[fail]'];
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [{ status: 'ok' }, { status: 'error', message: 'DeviceNotRegistered' }],
        }),
        { status: 200 },
      ),
    );

    const result = await sendEasPushNotifications(tokens, '제목', '내용');

    expect(result.successCount).toBe(1);
    expect(result.failureCount).toBe(1);
  });

  it('EAS API가 HTTP 오류(5xx)를 반환하면 해당 청크를 failureCount에 반영한다', async () => {
    const tokens = Array.from({ length: 3 }, (_, i) => `ExponentPushToken[token-${i}]`);
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(null, { status: 500 }),
    );

    const result = await sendEasPushNotifications(tokens, '제목', '내용');

    expect(result.successCount).toBe(0);
    expect(result.failureCount).toBe(3);
  });
});
