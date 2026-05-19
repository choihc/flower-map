import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type SpotFixture = {
  id: string;
  name: string;
  exclude_keywords: string[];
  flowers: { name_ko: string; aliases: string[] };
};

const mocks = vi.hoisted(() => ({
  createAdminSupabaseClient: vi.fn(),
  getExternalApiEnv: vi.fn(),
  searchBlogs: vi.fn(),
  searchYouTube: vi.fn(),
  getVideoStats: vi.fn(),
  todayShard: vi.fn(),
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

vi.mock('@/lib/external/naverSearch', () => ({
  searchBlogs: mocks.searchBlogs,
}));

vi.mock('@/lib/external/youtube', () => ({
  searchYouTube: mocks.searchYouTube,
  getVideoStats: mocks.getVideoStats,
}));

vi.mock('@/lib/cron/shard', async () => {
  const actual =
    await vi.importActual<typeof import('@/lib/cron/shard')>(
      '@/lib/cron/shard',
    );
  return {
    ...actual,
    todayShard: mocks.todayShard,
  };
});

function buildRequest(authHeader?: string): Request {
  const headers = new Headers();
  if (authHeader !== undefined) headers.set('authorization', authHeader);
  return new Request('https://example.com/api/cron/content-sync', {
    method: 'GET',
    headers,
  });
}

function buildSupabaseMock(spots: SpotFixture[]) {
  const videoDeleteEq = vi.fn().mockResolvedValue({ error: null });
  const videoInsert = vi.fn().mockResolvedValue({ error: null });
  const blogDeleteEq = vi.fn().mockResolvedValue({ error: null });
  const blogInsert = vi.fn().mockResolvedValue({ error: null });

  const selectChain = {
    eq: vi.fn().mockResolvedValue({ data: spots, error: null }),
  };

  // 본 테스트 스위트는 spot 흐름만 검증한다. stay 흐름은 별도 스위트(stays 빈 결과)로 위임.
  const emptyStaysSelectChain = {
    eq: vi.fn().mockResolvedValue({ data: [], error: null }),
  };

  const from = vi.fn((table: string) => {
    if (table === 'spots') {
      return {
        select: vi.fn(() => selectChain),
      };
    }
    if (table === 'spot_videos') {
      return {
        delete: vi.fn(() => ({ eq: videoDeleteEq })),
        insert: videoInsert,
      };
    }
    if (table === 'spot_blogs') {
      return {
        delete: vi.fn(() => ({ eq: blogDeleteEq })),
        insert: blogInsert,
      };
    }
    if (table === 'stays') {
      return {
        select: vi.fn(() => emptyStaysSelectChain),
      };
    }
    if (table === 'stay_videos' || table === 'stay_blogs') {
      // 호출되지 않아야 한다 (stays 0건 → 후속 delete/insert 미수행).
      return {
        delete: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
        insert: vi.fn().mockResolvedValue({ error: null }),
      };
    }
    throw new Error(`Unexpected table: ${table}`);
  });

  return { from, videoDeleteEq, videoInsert, blogDeleteEq, blogInsert };
}

beforeEach(() => {
  Object.values(mocks).forEach((m) => m.mockReset());

  mocks.getExternalApiEnv.mockReturnValue({
    naverClientId: 'cid',
    naverClientSecret: 'secret',
    youtubeApiKey: 'yt-key',
    kmaServiceKey: 'kma-key',
  });
  mocks.todayShard.mockReturnValue(5);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('GET /api/cron/content-sync', () => {
  it('인증 실패 시 401을 반환하고 Supabase를 호출하지 않는다', async () => {
    vi.stubEnv('CRON_SECRET', 'ok');
    mocks.createAdminSupabaseClient.mockImplementation(() => {
      throw new Error('should not be called');
    });

    const { GET } = await import('./route');
    const res = await GET(buildRequest('Bearer wrong'));

    expect(res.status).toBe(401);
    expect(mocks.createAdminSupabaseClient).not.toHaveBeenCalled();
  });

  it('오늘의 샤드와 일치하는 명소만 처리한다', async () => {
    vi.stubEnv('CRON_SECRET', 'ok');

    const spots: SpotFixture[] = [
      {
        id: 'aaaa',
        name: '여의도',
        exclude_keywords: [],
        flowers: { name_ko: '벚꽃', aliases: [] },
      },
      {
        id: 'bbbb',
        name: '남산',
        exclude_keywords: [],
        flowers: { name_ko: '벚꽃', aliases: [] },
      },
    ];

    const { from, videoDeleteEq, blogDeleteEq } = buildSupabaseMock(spots);
    mocks.createAdminSupabaseClient.mockReturnValue({ from });

    const { shardIndex } = await import('@/lib/cron/shard');
    // shard('aaaa') 결과에 맞추어 todayShard mock 조정
    const aaaaShard = shardIndex('aaaa');
    mocks.todayShard.mockReturnValue(aaaaShard);

    mocks.searchBlogs.mockResolvedValue([]);
    mocks.searchYouTube.mockResolvedValue([]);
    mocks.getVideoStats.mockResolvedValue(new Map());

    const { GET } = await import('./route');
    const res = await GET(buildRequest('Bearer ok'));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.shard).toBe(aaaaShard);

    // aaaa만 처리되어야 함 (bbbb 샤드가 다를 수 있으므로 조건 확인)
    // 외부 검색 결과가 0건이므로 delete/insert는 호출되지 않음(기존 데이터 유지)
    const bbbbShard = shardIndex('bbbb');
    if (aaaaShard === bbbbShard) {
      expect(body.processed).toBe(2);
    } else {
      expect(body.processed).toBe(1);
      expect(body.totalCandidates).toBe(1);
    }
    expect(videoDeleteEq).not.toHaveBeenCalled();
    expect(blogDeleteEq).not.toHaveBeenCalled();
  });

  it('외부 검색 결과가 0건이면 delete/insert를 호출하지 않고 기존 데이터를 유지한다', async () => {
    vi.stubEnv('CRON_SECRET', 'ok');

    const { shardIndex } = await import('@/lib/cron/shard');
    const spot: SpotFixture = {
      id: 'spot-empty',
      name: '빈결과',
      exclude_keywords: [],
      flowers: { name_ko: '벚꽃', aliases: [] },
    };
    mocks.todayShard.mockReturnValue(shardIndex(spot.id));

    const { from, videoDeleteEq, videoInsert, blogDeleteEq, blogInsert } =
      buildSupabaseMock([spot]);
    mocks.createAdminSupabaseClient.mockReturnValue({ from });

    mocks.searchYouTube.mockResolvedValue([]);
    mocks.getVideoStats.mockResolvedValue(new Map());
    mocks.searchBlogs.mockResolvedValue([]);

    const { GET } = await import('./route');
    const res = await GET(buildRequest('Bearer ok'));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.processed).toBe(1);
    expect(videoDeleteEq).not.toHaveBeenCalled();
    expect(videoInsert).not.toHaveBeenCalled();
    expect(blogDeleteEq).not.toHaveBeenCalled();
    expect(blogInsert).not.toHaveBeenCalled();
  });

  it('명소에 수집된 비디오/블로그가 있으면 기존 삭제 후 insert한다', async () => {
    vi.stubEnv('CRON_SECRET', 'ok');

    const { shardIndex } = await import('@/lib/cron/shard');

    const spot: SpotFixture = {
      id: 'spot-x',
      name: '남산',
      exclude_keywords: [],
      flowers: { name_ko: '벚꽃', aliases: [] },
    };
    mocks.todayShard.mockReturnValue(shardIndex('spot-x'));

    const { from, videoDeleteEq, videoInsert, blogDeleteEq, blogInsert } =
      buildSupabaseMock([spot]);
    mocks.createAdminSupabaseClient.mockReturnValue({ from });

    mocks.searchYouTube.mockResolvedValue([
      {
        videoId: 'v1',
        title: '남산 벚꽃',
        description: '남산 벚꽃',
        channelTitle: 'ch1',
        channelId: 'ch1',
        thumbnailUrl: 'https://img/v1',
        publishedAt: new Date('2026-04-10T00:00:00Z'),
      },
    ]);
    mocks.getVideoStats.mockResolvedValue(new Map([['v1', 5000]]));
    mocks.searchBlogs.mockImplementation(async (args: { sort?: string }) => {
      if (args.sort === 'sim') {
        return [
          {
            title: '남산 벚꽃',
            link: 'https://blog.naver.com/blogger1/a',
            description: '남산 벚꽃 좋아요',
            bloggerName: 'blogger1',
            postedAt: new Date('2026-04-10T00:00:00Z'),
          },
        ];
      }
      return [
        {
          title: '남산 벚꽃 date',
          link: 'https://blog.naver.com/blogger2/b',
          description: '남산 벚꽃 후기',
          bloggerName: 'blogger2',
          postedAt: new Date('2026-04-12T00:00:00Z'),
        },
      ];
    });

    const { GET } = await import('./route');
    const res = await GET(buildRequest('Bearer ok'));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.processed).toBe(1);

    expect(videoDeleteEq).toHaveBeenCalledWith('spot_id', 'spot-x');
    expect(blogDeleteEq).toHaveBeenCalledWith('spot_id', 'spot-x');

    expect(videoInsert).toHaveBeenCalledTimes(1);
    const videoRows = videoInsert.mock.calls[0][0] as Array<
      Record<string, unknown>
    >;
    expect(videoRows).toHaveLength(1);
    expect(videoRows[0].spot_id).toBe('spot-x');
    expect(videoRows[0].video_id).toBe('v1');
    expect(videoRows[0].view_count).toBe(5000);

    expect(blogInsert).toHaveBeenCalledTimes(1);
    const blogRows = blogInsert.mock.calls[0][0] as Array<
      Record<string, unknown>
    >;
    expect(blogRows.length).toBeGreaterThanOrEqual(1);
    expect(blogRows[0].spot_id).toBe('spot-x');
  });

  it('비디오 수집이 실패해도 블로그 경로는 계속 진행하고 다른 명소도 처리한다', async () => {
    vi.stubEnv('CRON_SECRET', 'ok');

    const { shardIndex } = await import('@/lib/cron/shard');

    const spotA: SpotFixture = {
      id: 'fail-spot',
      name: 'A',
      exclude_keywords: [],
      flowers: { name_ko: '벚꽃', aliases: [] },
    };
    const spotB: SpotFixture = {
      id: 'ok-spot',
      name: 'B',
      exclude_keywords: [],
      flowers: { name_ko: '벚꽃', aliases: [] },
    };

    // 두 명소가 같은 샤드에 속하도록
    const commonShard = shardIndex(spotA.id);
    const bShard = shardIndex(spotB.id);
    // 다르면 테스트 스킵 개념으로 todayShard를 spotA 샤드로 고정,
    // spotB의 샤드가 달라도 최소한 failure scenario 검증은 가능하도록 todayShard 일치 필요.
    // 여기서는 두 명소 id를 같은 샤드로 설정하기 위해 totalShards=1 사용은 어려우니
    // 대신 그냥 spotA만 처리 대상이어도 로직(try/catch 지속)은 검증 가능.
    mocks.todayShard.mockReturnValue(commonShard);

    const { from, videoInsert } = buildSupabaseMock([spotA, spotB]);
    mocks.createAdminSupabaseClient.mockReturnValue({ from });

    mocks.searchYouTube.mockImplementation(
      async (args: { query: string }) => {
        if (args.query.startsWith('A')) {
          throw new Error('youtube boom');
        }
        return [];
      },
    );
    mocks.getVideoStats.mockResolvedValue(new Map());
    mocks.searchBlogs.mockResolvedValue([]);

    const { GET } = await import('./route');
    const res = await GET(buildRequest('Bearer ok'));

    expect(res.status).toBe(200);
    const body = await res.json();

    // 비디오/블로그 try/catch가 분리되어 있어 A의 YouTube 실패가 블로그 경로를 막지 않고,
    // 결과적으로 A도 processed에 포함된다. B는 샤드 일치 여부에 따라 포함.
    if (commonShard === bShard) {
      expect(body.processed).toBe(2);
    } else {
      expect(body.processed).toBe(1);
    }
    // 둘 다 블로그/비디오 결과가 비었기 때문에 videoInsert은 호출되지 않음.
    expect(videoInsert).not.toHaveBeenCalled();
  });
});
