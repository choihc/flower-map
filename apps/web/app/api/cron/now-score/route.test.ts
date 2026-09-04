import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type SpotFixture = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  bloom_start_at: string | null;
  bloom_end_at: string | null;
  flower_id: string;
  flowers: { name_ko: string; aliases: string[] };
};

const mocks = vi.hoisted(() => ({
  createAdminSupabaseClient: vi.fn(),
  getExternalApiEnv: vi.fn(),
  fetchShortForecast: vi.fn(),
  fetchSearchTrends: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminSupabaseClient: mocks.createAdminSupabaseClient,
}));

vi.mock('@/lib/env', async () => {
  const actual =
    await vi.importActual<typeof import('@/lib/env')>('@/lib/env');
  return {
    ...actual,
    getExternalApiEnv: mocks.getExternalApiEnv,
  };
});

vi.mock('@/lib/external/kma', () => ({
  fetchShortForecast: mocks.fetchShortForecast,
}));

vi.mock('@/lib/external/naverDatalab', () => ({
  fetchSearchTrends: mocks.fetchSearchTrends,
}));

function buildRequest(authHeader?: string): Request {
  const headers = new Headers();
  if (authHeader !== undefined) headers.set('authorization', authHeader);
  return new Request('https://example.com/api/cron/now-score', {
    method: 'GET',
    headers,
  });
}

function buildSupabaseMock(
  spots: SpotFixture[],
  opts: {
    videoRows?: Array<{ spot_id: string }>;
    blogRows?: Array<{ spot_id: string }>;
  } = {},
): {
  from: ReturnType<typeof vi.fn>;
  updateMock: ReturnType<typeof vi.fn>;
  updateEqMock: ReturnType<typeof vi.fn>;
} {
  const updateEqMock = vi.fn().mockResolvedValue({ error: null });
  const updateMock = vi.fn(() => ({ eq: updateEqMock }));

  const selectChain = {
    eq: vi.fn().mockResolvedValue({ data: spots, error: null }),
  };

  const from = vi.fn((table: string) => {
    if (table === 'spots') {
      return {
        select: vi.fn(() => selectChain),
        eq: selectChain.eq,
        update: updateMock,
      };
    }
    if (table === 'spot_videos') {
      return {
        select: vi.fn(() => ({
          in: vi
            .fn()
            .mockResolvedValue({ data: opts.videoRows ?? [], error: null }),
        })),
      };
    }
    if (table === 'spot_blogs') {
      return {
        select: vi.fn(() => ({
          in: vi
            .fn()
            .mockResolvedValue({ data: opts.blogRows ?? [], error: null }),
        })),
      };
    }
    throw new Error(`Unexpected table: ${table}`);
  });

  return { from, updateMock, updateEqMock };
}

beforeEach(() => {
  mocks.createAdminSupabaseClient.mockReset();
  mocks.getExternalApiEnv.mockReset();
  mocks.fetchShortForecast.mockReset();
  mocks.fetchSearchTrends.mockReset();

  mocks.getExternalApiEnv.mockReturnValue({
    naverClientId: 'cid',
    naverClientSecret: 'secret',
    youtubeApiKey: 'yt-key',
    kmaServiceKey: 'kma-key',
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

/**
 * 계절성이 있는 주간 비율. 작년 동기 40, 최신 60, 중간에 창 최댓값 100.
 * `scale`은 데이터랩이 요청 전체를 통틀어 정규화할 때 생기는 배율을 흉내낸다.
 */
function seasonalRatio(index: number, total: number, scale = 1): number {
  if (index === Math.floor(total / 2)) return 100 * scale;
  return (index < total / 2 ? 40 : 60) * scale;
}

/** 주 시작일(월요일) 기준 54개 주간 버킷을 만든다. 데이터랩 주단위 응답 형태. */
function buildWeeklyBuckets(
  startDate: string,
  ratioAt: (index: number, total: number) => number,
  total = 54,
): Array<{ period: string; ratio: number }> {
  const first = Date.parse(`${startDate}T00:00:00Z`);
  return Array.from({ length: total }, (_, i) => ({
    period: new Date(first + i * 7 * 86400000).toISOString().slice(0, 10),
    ratio: ratioAt(i, total),
  }));
}

describe('GET /api/cron/now-score', () => {
  it('인증 실패 시 401을 반환하고 Supabase를 호출하지 않는다', async () => {
    vi.stubEnv('CRON_SECRET', 'valid-secret');
    mocks.createAdminSupabaseClient.mockImplementation(() => {
      throw new Error('should not be called');
    });

    const { GET } = await import('./route');
    const res = await GET(buildRequest('Bearer wrong'));

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('unauthorized');
    expect(mocks.createAdminSupabaseClient).not.toHaveBeenCalled();
  });

  it('명소 2개를 정상 처리하고 now_score를 업데이트한다', async () => {
    vi.stubEnv('CRON_SECRET', 'ok');

    const spots: SpotFixture[] = [
      {
        id: 'spot-1',
        name: '여의도 공원',
        latitude: 37.528,
        longitude: 126.932,
        bloom_start_at: '2026-04-10T00:00:00Z',
        bloom_end_at: '2026-04-25T00:00:00Z',
        flower_id: 'flower-1',
        flowers: { name_ko: '벚꽃', aliases: ['cherry'] },
      },
      {
        id: 'spot-2',
        name: '에버랜드',
        latitude: 37.294,
        longitude: 127.202,
        bloom_start_at: '2026-04-15T00:00:00Z',
        bloom_end_at: '2026-04-30T00:00:00Z',
        flower_id: 'flower-2',
        flowers: { name_ko: '튤립', aliases: [] },
      },
    ];

    const videoRows = Array.from({ length: 5 }, () => ({
      spot_id: 'spot-1',
    }));
    const blogRows = Array.from({ length: 12 }, () => ({
      spot_id: 'spot-1',
    }));
    const { from, updateMock, updateEqMock } = buildSupabaseMock(spots, {
      videoRows,
      blogRows,
    });
    mocks.createAdminSupabaseClient.mockReturnValue({ from });

    mocks.fetchShortForecast.mockResolvedValue({
      tempC: 18,
      precipitationMm: 2,
    });

    // 54주 주간 버킷을 요청받은 구간에서 그대로 생성한다. 앞쪽(작년 동기)
    // 40, 뒤쪽(최신) 60, 중간에 창 최댓값 100을 둔다. 최신/최고(가장 오래된)
    // 매핑이 뒤집히거나 최댓값 나눗셈이 빠지면 값으로 즉시 드러난다.
    mocks.fetchSearchTrends.mockImplementation(
      async (args: {
        startDate: string;
        endDate: string;
        timeUnit?: string;
        groups: Array<{ groupName: string }>;
      }) => {
        const data = buildWeeklyBuckets(args.startDate, seasonalRatio);
        return args.groups.map((g) => ({ groupName: g.groupName, data }));
      },
    );

    const { GET } = await import('./route');
    const res = await GET(buildRequest('Bearer ok'));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.processed).toBe(2);

    expect(mocks.fetchShortForecast).toHaveBeenCalledTimes(2);
    expect(from).toHaveBeenCalledWith('spots');
    expect(updateMock).toHaveBeenCalledTimes(2);
    expect(updateEqMock).toHaveBeenCalledTimes(2);

    // 배치당 데이터랩 호출은 1회다. 명소 2건은 배치 크기 5 안에 들어가므로
    // 전체 1회여야 한다. (yoy용 두 번째 요청을 되살리면 여기서 깨진다)
    expect(mocks.fetchSearchTrends).toHaveBeenCalledTimes(1);

    const trendArgs = mocks.fetchSearchTrends.mock.calls[0][0] as {
      startDate: string;
      endDate: string;
      timeUnit: string;
      groups: Array<{ groupName: string; keywords: string[] }>;
    };
    expect(trendArgs.timeUnit).toBe('week');
    // 주 경계 정렬: 시작은 월요일, 종료는 일요일, 구간은 54주다.
    expect(new Date(`${trendArgs.startDate}T00:00:00Z`).getUTCDay()).toBe(1);
    expect(new Date(`${trendArgs.endDate}T00:00:00Z`).getUTCDay()).toBe(0);
    expect(
      (Date.parse(trendArgs.endDate) - Date.parse(trendArgs.startDate)) /
        86400000 +
        1,
    ).toBe(54 * 7);
    expect(trendArgs.groups.map((g) => g.groupName)).toEqual([
      'spot-1',
      'spot-2',
    ]);

    for (const call of updateMock.mock.calls as Array<
      [Record<string, unknown>]
    >) {
      const payload = call[0];
      expect(payload.bloom_score).toEqual(expect.any(Number));
      // 최신 주 60 / 창 최댓값 100 = 60. 매핑이 뒤집히면 40이 된다.
      expect(payload.trend_score).toBe(60);
      // yoy는 최근 60 대 작년 40 → 1.5배 → 75.
      expect(payload.yoy_score).toBe(75);
      expect(payload.content_score).toEqual(expect.any(Number));
      expect(payload.now_score).toEqual(expect.any(Number));
      expect(payload.now_score_at).toEqual(expect.any(String));
    }
  });

  it('데이터랩 응답이 배치 동료 때문에 축소돼도 trend_score가 같다', async () => {
    // 데이터랩은 한 요청에 든 모든 키워드 그룹을 통틀어 정규화한다. 그래서
    // 같은 명소의 원시 ratio가 함께 묶인 명소에 따라 달라진다. trend는 그룹
    // 자신의 최댓값 대비 상대값이어야 이 배율에 흔들리지 않는다.
    const runWithScale = async (scale: number) => {
      vi.resetModules();
      vi.stubEnv('CRON_SECRET', 'ok');
      const spots: SpotFixture[] = [
        {
          id: 'spot-1',
          name: '태화강국가정원',
          latitude: 35.55,
          longitude: 129.31,
          bloom_start_at: '2026-09-01T00:00:00Z',
          bloom_end_at: '2026-10-15T00:00:00Z',
          flower_id: 'flower-1',
          flowers: { name_ko: '코스모스', aliases: [] },
        },
      ];
      const { from, updateMock } = buildSupabaseMock(spots);
      mocks.createAdminSupabaseClient.mockReturnValue({ from });
      mocks.fetchShortForecast.mockResolvedValue({
        tempC: 20,
        precipitationMm: 0,
      });
      mocks.fetchSearchTrends.mockImplementation(
        async (args: {
          startDate: string;
          groups: Array<{ groupName: string }>;
        }) => {
          const data = buildWeeklyBuckets(args.startDate, (i, t) =>
            seasonalRatio(i, t, scale),
          );
          return args.groups.map((g) => ({ groupName: g.groupName, data }));
        },
      );
      const { GET } = await import('./route');
      await GET(buildRequest('Bearer ok'));
      return (updateMock.mock.calls[0] as [Record<string, unknown>])[0];
    };

    const full = await runWithScale(1);
    const shrunk = await runWithScale(0.8383); // 실측된 축소 배율

    expect(full.trend_score).toBe(60);
    expect(shrunk.trend_score).toBe(60);
    expect(shrunk.yoy_score).toBe(full.yoy_score);
  });

  it('개화기에만 데이터가 있는 희소 응답은 비수기 점수를 올리지 않는다', async () => {
    // 데이터랩은 검색량이 기준 미달인 주를 버킷째로 생략한다. 배열 위치로
    // 최신값을 뽑으면 응답에 남은 지난 개화기 피크를 "지금 인기"로 오독해,
    // 이 변경이 없애려던 비수기 고득점이 그대로 되살아난다.
    vi.stubEnv('CRON_SECRET', 'ok');

    const spots: SpotFixture[] = [
      {
        id: 'spot-1',
        name: '여좌천',
        latitude: 35.152,
        longitude: 128.712,
        bloom_start_at: '2026-03-25T00:00:00Z',
        bloom_end_at: '2026-04-05T00:00:00Z',
        flower_id: 'flower-1',
        flowers: { name_ko: '벚꽃', aliases: [] },
      },
    ];
    const { from, updateMock } = buildSupabaseMock(spots);
    mocks.createAdminSupabaseClient.mockReturnValue({ from });
    mocks.fetchShortForecast.mockResolvedValue({
      tempC: 20,
      precipitationMm: 0,
    });

    mocks.fetchSearchTrends.mockImplementation(
      async (args: {
        startDate: string;
        groups: Array<{ groupName: string }>;
      }) => {
        // 창 앞쪽에서 3주만 값이 있고 나머지 주는 생략된 응답.
        const all = buildWeeklyBuckets(args.startDate, () => 0);
        const data = all
          .slice(2, 5)
          .map((p, i) => ({ period: p.period, ratio: [50, 100, 70][i] }));
        return args.groups.map((g) => ({ groupName: g.groupName, data }));
      },
    );

    const { GET } = await import('./route');
    const res = await GET(buildRequest('Bearer ok'));

    expect(res.status).toBe(200);
    const payload = (updateMock.mock.calls[0] as [Record<string, unknown>])[0];
    // 최신 2주가 응답에 없으므로 검색량 0으로 본다.
    expect(payload.trend_score).toBe(0);
    // 작년 동기도 0이라 전년 대비를 계산할 수 없다.
    expect(payload.yoy_score).toBeNull();
  });

  it('일부 외부 API 실패 시 해당 sub-score를 null로 두고 나머지는 계산한다', async () => {
    vi.stubEnv('CRON_SECRET', 'ok');

    const spots: SpotFixture[] = [
      {
        id: 'spot-1',
        name: '남산',
        latitude: 37.55,
        longitude: 126.99,
        bloom_start_at: '2026-04-10T00:00:00Z',
        bloom_end_at: '2026-04-25T00:00:00Z',
        flower_id: 'flower-1',
        flowers: { name_ko: '벚꽃', aliases: [] },
      },
    ];

    const { from, updateMock } = buildSupabaseMock(spots);
    mocks.createAdminSupabaseClient.mockReturnValue({ from });

    mocks.fetchShortForecast.mockResolvedValue({
      tempC: 15,
      precipitationMm: 0,
    });
    mocks.fetchSearchTrends.mockRejectedValue(new Error('datalab fail'));

    const { GET } = await import('./route');
    const res = await GET(buildRequest('Bearer ok'));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.processed).toBe(1);

    const payload = (
      updateMock.mock.calls as Array<[Record<string, unknown>]>
    )[0][0];
    expect(payload.bloom_score).toEqual(expect.any(Number));
    expect(payload.trend_score).toBeNull();
    expect(payload.yoy_score).toBeNull();
    // 외부 호출 없이 DB 집계(0건)라 content_score는 0 (null이 아님)
    expect(payload.content_score).toBe(0);
    expect(payload.now_score).toEqual(expect.any(Number));
  });

  it('bloom 일자가 없는 명소는 bloom_score를 null로 기록한다', async () => {
    vi.stubEnv('CRON_SECRET', 'ok');

    const spots: SpotFixture[] = [
      {
        id: 'spot-nb',
        name: '무기간',
        latitude: 37.0,
        longitude: 127.0,
        bloom_start_at: null,
        bloom_end_at: null,
        flower_id: 'f',
        flowers: { name_ko: '꽃', aliases: [] },
      },
    ];

    const { from, updateMock } = buildSupabaseMock(spots);
    mocks.createAdminSupabaseClient.mockReturnValue({ from });

    mocks.fetchShortForecast.mockResolvedValue({
      tempC: 10,
      precipitationMm: 0,
    });
    mocks.fetchSearchTrends.mockResolvedValue([
      {
        groupName: '무기간 꽃',
        data: [{ period: '2026-04-01', ratio: 30 }],
      },
    ]);

    const { GET } = await import('./route');
    const res = await GET(buildRequest('Bearer ok'));

    expect(res.status).toBe(200);
    const payload = (
      updateMock.mock.calls as Array<[Record<string, unknown>]>
    )[0][0];
    expect(payload.bloom_score).toBeNull();
    expect(payload.now_score).not.toBeNull();
  });
});
