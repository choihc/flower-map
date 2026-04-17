import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchSearchTrends, type TrendGroup } from './naverDatalab';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const BASE_GROUPS: TrendGroup[] = [
  { groupName: '벚꽃', keywords: ['벚꽃', '벚꽃축제'] },
  { groupName: '튤립', keywords: ['튤립'] },
];

describe('fetchSearchTrends', () => {
  it('정상 응답을 TrendResult 배열로 파싱한다', async () => {
    const apiResponse = {
      startDate: '2026-04-01',
      endDate: '2026-04-07',
      timeUnit: 'date',
      results: [
        {
          title: '벚꽃',
          keywords: ['벚꽃', '벚꽃축제'],
          data: [
            { period: '2026-04-01', ratio: 12.3 },
            { period: '2026-04-02', ratio: 45.6 },
          ],
        },
        {
          title: '튤립',
          keywords: ['튤립'],
          data: [{ period: '2026-04-01', ratio: 7.8 }],
        },
      ],
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => apiResponse,
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchSearchTrends({
      clientId: 'CID',
      clientSecret: 'CSECRET',
      startDate: '2026-04-01',
      endDate: '2026-04-07',
      groups: BASE_GROUPS,
    });

    expect(result).toEqual([
      {
        groupName: '벚꽃',
        data: [
          { period: '2026-04-01', ratio: 12.3 },
          { period: '2026-04-02', ratio: 45.6 },
        ],
      },
      {
        groupName: '튤립',
        data: [{ period: '2026-04-01', ratio: 7.8 }],
      },
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [calledUrl, init] = fetchMock.mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(calledUrl).toBe('https://openapi.naver.com/v1/datalab/search');
    expect(init.method).toBe('POST');
    const headers = init.headers as Record<string, string>;
    expect(headers['X-Naver-Client-Id']).toBe('CID');
    expect(headers['X-Naver-Client-Secret']).toBe('CSECRET');
    expect(headers['Content-Type']).toBe('application/json');

    const body = JSON.parse(init.body as string);
    expect(body).toEqual({
      startDate: '2026-04-01',
      endDate: '2026-04-07',
      timeUnit: 'date',
      keywordGroups: BASE_GROUPS,
    });
  });

  it('4xx 응답이 오면 예외를 throw 한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'unauthorized',
      }),
    );

    await expect(
      fetchSearchTrends({
        clientId: 'CID',
        clientSecret: 'CSECRET',
        startDate: '2026-04-01',
        endDate: '2026-04-07',
        groups: BASE_GROUPS,
      }),
    ).rejects.toThrow(/Naver Datalab/);
  });

  it('groups.length가 5를 초과하면 사전 검증에서 throw 한다', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const tooManyGroups: TrendGroup[] = Array.from({ length: 6 }, (_, i) => ({
      groupName: `그룹${i}`,
      keywords: [`키워드${i}`],
    }));

    await expect(
      fetchSearchTrends({
        clientId: 'CID',
        clientSecret: 'CSECRET',
        startDate: '2026-04-01',
        endDate: '2026-04-07',
        groups: tooManyGroups,
      }),
    ).rejects.toThrow(/최대 5/);

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
