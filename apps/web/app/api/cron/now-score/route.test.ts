import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type SupabaseChain = {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
};

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
  searchBlogs: vi.fn(),
  searchYouTube: vi.fn(),
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

vi.mock('@/lib/external/naverSearch', () => ({
  searchBlogs: mocks.searchBlogs,
}));

vi.mock('@/lib/external/youtube', () => ({
  searchYouTube: mocks.searchYouTube,
}));

function buildRequest(authHeader?: string): Request {
  const headers = new Headers();
  if (authHeader !== undefined) headers.set('authorization', authHeader);
  return new Request('https://example.com/api/cron/now-score', {
    method: 'GET',
    headers,
  });
}

function buildSupabaseMock(spots: SpotFixture[]): {
  from: ReturnType<typeof vi.fn>;
  updateMock: ReturnType<typeof vi.fn>;
  updateEqMock: ReturnType<typeof vi.fn>;
} {
  const updateEqMock = vi.fn().mockResolvedValue({ error: null });
  const updateMock = vi.fn(() => ({ eq: updateEqMock }));

  const selectChain = {
    eq: vi.fn().mockResolvedValue({ data: spots, error: null }),
  };

  const from = vi.fn((table: string): SupabaseChain => {
    if (table !== 'spots') {
      throw new Error(`Unexpected table: ${table}`);
    }
    return {
      select: vi.fn(() => selectChain),
      eq: selectChain.eq,
      update: updateMock,
    };
  });

  return { from, updateMock, updateEqMock };
}

beforeEach(() => {
  mocks.createAdminSupabaseClient.mockReset();
  mocks.getExternalApiEnv.mockReset();
  mocks.fetchShortForecast.mockReset();
  mocks.fetchSearchTrends.mockReset();
  mocks.searchBlogs.mockReset();
  mocks.searchYouTube.mockReset();

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

    const { from, updateMock, updateEqMock } = buildSupabaseMock(spots);
    mocks.createAdminSupabaseClient.mockReturnValue({ from });

    mocks.fetchShortForecast.mockResolvedValue({
      tempC: 18,
      precipitationMm: 2,
    });

    mocks.fetchSearchTrends.mockImplementation(
      async (args: {
        startDate: string;
        endDate: string;
        groups: Array<{ groupName: string }>;
      }) => {
        // startDate가 1년 전인 경우(yoy 호출): 최근 7일 + 작년 7일 구간 모두 데이터 제공
        // trend 호출은 최근 7일 구간만 포함된 데이터 제공
        const today = new Date();
        const recent: Array<{ period: string; ratio: number }> = [];
        for (let i = 0; i < 8; i++) {
          const d = new Date(today.getTime() - i * 86400000);
          const y = d.getUTCFullYear().toString().padStart(4, '0');
          const m = (d.getUTCMonth() + 1).toString().padStart(2, '0');
          const day = d.getUTCDate().toString().padStart(2, '0');
          recent.push({ period: `${y}-${m}-${day}`, ratio: 60 });
        }
        const lastYear: Array<{ period: string; ratio: number }> = [];
        const oneYearAgo = new Date(today);
        oneYearAgo.setUTCFullYear(oneYearAgo.getUTCFullYear() - 1);
        for (let i = 0; i < 8; i++) {
          const d = new Date(oneYearAgo.getTime() - i * 86400000);
          const y = d.getUTCFullYear().toString().padStart(4, '0');
          const m = (d.getUTCMonth() + 1).toString().padStart(2, '0');
          const day = d.getUTCDate().toString().padStart(2, '0');
          lastYear.push({ period: `${y}-${m}-${day}`, ratio: 40 });
        }

        return args.groups.map((g) => ({
          groupName: g.groupName,
          data: [...recent, ...lastYear],
        }));
      },
    );

    mocks.searchBlogs.mockResolvedValue(
      Array.from({ length: 12 }, (_, i) => ({
        title: `blog-${i}`,
        link: `https://b.example/${i}`,
        description: 'd',
        bloggerName: 'name',
        postedAt: new Date('2026-04-15T00:00:00Z'),
      })),
    );

    mocks.searchYouTube.mockResolvedValue(
      Array.from({ length: 5 }, (_, i) => ({
        videoId: `v${i}`,
        title: 't',
        description: 'd',
        channelTitle: 'c',
        channelId: `c${i}`,
        thumbnailUrl: 'https://img',
        publishedAt: new Date('2026-04-15T00:00:00Z'),
      })),
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

    for (const call of updateMock.mock.calls as Array<
      [Record<string, unknown>]
    >) {
      const payload = call[0];
      expect(payload.bloom_score).toEqual(expect.any(Number));
      expect(payload.trend_score).toEqual(expect.any(Number));
      expect(payload.content_score).toEqual(expect.any(Number));
      expect(payload.yoy_score).toEqual(expect.any(Number));
      expect(payload.now_score).toEqual(expect.any(Number));
      expect(payload.now_score_at).toEqual(expect.any(String));
    }
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
    mocks.searchBlogs.mockResolvedValue([]);
    mocks.searchYouTube.mockResolvedValue([]);

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
    expect(payload.content_score).toEqual(expect.any(Number));
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
    mocks.searchBlogs.mockResolvedValue([]);
    mocks.searchYouTube.mockResolvedValue([]);

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
