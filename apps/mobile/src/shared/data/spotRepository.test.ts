import { describe, expect, it, vi } from 'vitest';

const mockRow = {
  id: 'spot-1',
  slug: 'yeouido-yunjung-ro',
  name: '여의도 윤중로',
  flower: { name_ko: '벚꽃', thumbnail_url: 'https://blob.example.com/flower-cherry.jpg' },
  region_secondary: '서울 영등포구',
  description: '설명',
  short_tip: '팁',
  admission_fee: '무료',
  parking_info: null,
  festival_start_at: '2026-04-01',
  festival_end_at: '2026-04-07',
  bloom_start_at: '2026-03-28',
  bloom_end_at: '2026-04-10',
  is_featured: true,
  latitude: 37.5288,
  longitude: 126.9291,
  thumbnail_url: 'https://blob.example.com/cherry.jpg',
};

const topSpotRows = [
  { ...mockRow, id: 'top-1', slug: 'top-1', name: 'TOP 1', now_score: 95 },
  { ...mockRow, id: 'top-2', slug: 'top-2', name: 'TOP 2', now_score: 88 },
  { ...mockRow, id: 'top-3', slug: 'top-3', name: 'TOP 3', now_score: 70 },
];

const videoRows = [
  {
    video_id: 'vid-1',
    title: '벚꽃 여행',
    channel_title: '여행 채널',
    thumbnail_url: 'https://img/1.jpg',
    published_at: '2026-04-10T00:00:00Z',
  },
  {
    video_id: 'vid-2',
    title: '벚꽃 산책',
    channel_title: '산책 채널',
    thumbnail_url: 'https://img/2.jpg',
    published_at: '2026-04-08T00:00:00Z',
  },
  {
    video_id: 'vid-3',
    title: '벚꽃 드라이브',
    channel_title: '드라이브 채널',
    thumbnail_url: 'https://img/3.jpg',
    published_at: '2026-04-05T00:00:00Z',
  },
];

const blogRows = [
  { url: 'https://b1', title: '블로그1', blogger_name: '블로거1', posted_at: '2026-04-10T00:00:00Z' },
  { url: 'https://b2', title: '블로그2', blogger_name: '블로거2', posted_at: '2026-04-09T00:00:00Z' },
  { url: 'https://b3', title: '블로그3', blogger_name: '블로거3', posted_at: '2026-04-08T00:00:00Z' },
  { url: 'https://b4', title: '블로그4', blogger_name: '블로거4', posted_at: '2026-04-07T00:00:00Z' },
  { url: 'https://b5', title: '블로그5', blogger_name: '블로거5', posted_at: '2026-04-06T00:00:00Z' },
];

// getTopSpots / getPublishedSpots / getSpotContent 각각에 대해
// from(table)이 반환할 체인 객체를 테이블+함수 문맥별로 제어한다.
//
// 설계:
// - from('spots') 체인에서 .maybeSingle()이 호출되면 단일 row 반환 (getPublishedSpotBySlug/getSpotContent용)
// - from('spots') 체인에서 그렇지 않으면 배열 반환.
//   단, 체인 도중 .eq('status','published')만 있고 .eq('slug', ...)이 없으면
//   getPublishedSpots 또는 getTopSpots로 해석.
// - getTopSpots 쿼리인지 판단은 .not('now_score',...) 호출 기록으로 판별.
// - from('spot_videos') / from('spot_blogs')는 단순 배열 반환.
//
// 각 쿼리의 호출 인자를 recordCalls에 기록하여 필터/정렬 검증에 활용한다.

type AnyFn = (...args: unknown[]) => unknown;

type ChainCalls = {
  eq: Array<[string, unknown]>;
  order: Array<[string, unknown?]>;
};

const lastSpotsCalls: ChainCalls[] = [];
const lastVideoCalls: ChainCalls[] = [];
const lastBlogCalls: ChainCalls[] = [];

function resetCallsFor(table: 'spots' | 'spot_videos' | 'spot_blogs') {
  if (table === 'spots') lastSpotsCalls.length = 0;
  if (table === 'spot_videos') lastVideoCalls.length = 0;
  if (table === 'spot_blogs') lastBlogCalls.length = 0;
}

function makeSpotsChain() {
  const state = { calls: new Set<string>() };
  const recorded: ChainCalls = { eq: [], order: [] };
  lastSpotsCalls.push(recorded);

  const chain: Record<string, AnyFn> & PromiseLike<unknown> = {
    select(..._args: unknown[]) {
      state.calls.add('select');
      return chain;
    },
    eq(column: unknown, value: unknown) {
      state.calls.add('eq');
      recorded.eq.push([String(column), value]);
      return chain;
    },
    not(..._args: unknown[]) {
      state.calls.add('not');
      return chain;
    },
    order(column: unknown, options?: unknown) {
      state.calls.add('order');
      recorded.order.push([String(column), options]);
      return chain;
    },
    limit(..._args: unknown[]) {
      state.calls.add('limit');
      return chain;
    },
    maybeSingle() {
      state.calls.add('maybeSingle');
      return Promise.resolve({ data: mockRow, error: null });
    },
    then(onFulfilled?: (v: { data: unknown; error: unknown }) => unknown) {
      const data = state.calls.has('not') || state.calls.has('limit') ? topSpotRows : [mockRow];
      return Promise.resolve({ data, error: null }).then(onFulfilled);
    },
  } as Record<string, AnyFn> & PromiseLike<unknown>;

  return chain;
}

function makeArrayChain(
  rows: unknown[],
  recorded?: ChainCalls,
) {
  const chain: Record<string, AnyFn> & PromiseLike<unknown> = {
    select(..._args: unknown[]) {
      return chain;
    },
    eq(column: unknown, value: unknown) {
      if (recorded) recorded.eq.push([String(column), value]);
      return chain;
    },
    in(..._args: unknown[]) {
      return chain;
    },
    order(column: unknown, options?: unknown) {
      if (recorded) recorded.order.push([String(column), options]);
      return chain;
    },
    limit(..._args: unknown[]) {
      return chain;
    },
    maybeSingle() {
      return Promise.resolve({ data: rows[0] ?? null, error: null });
    },
    single() {
      return Promise.resolve({ data: rows[0] ?? null, error: null });
    },
    then(onFulfilled?: (v: { data: unknown; error: unknown }) => unknown) {
      return Promise.resolve({ data: rows, error: null }).then(onFulfilled);
    },
  } as Record<string, AnyFn> & PromiseLike<unknown>;

  return chain;
}

let videoRowsOverride: unknown[] | null = null;
let blogRowsOverride: unknown[] | null = null;

vi.mock('../lib/supabase', () => {
  return {
    supabase: {
      from: (table: string) => {
        if (table === 'spots') return makeSpotsChain();
        if (table === 'spot_videos') {
          const recorded: ChainCalls = { eq: [], order: [] };
          lastVideoCalls.push(recorded);
          return makeArrayChain(videoRowsOverride ?? videoRows, recorded);
        }
        if (table === 'spot_blogs') {
          const recorded: ChainCalls = { eq: [], order: [] };
          lastBlogCalls.push(recorded);
          return makeArrayChain(blogRowsOverride ?? blogRows, recorded);
        }
        return makeArrayChain([]);
      },
    },
  };
});

import { getPublishedSpotBySlug, getPublishedSpots, getSpotContent, getTopSpots } from './spotRepository';

describe('spotRepository', () => {
  it('returns mapped FlowerSpot list from Supabase', async () => {
    const spots = await getPublishedSpots();

    expect(spots).toHaveLength(1);
    expect(spots[0]?.id).toBe('spot-1');
    expect(spots[0]?.slug).toBe('yeouido-yunjung-ro');
    expect(spots[0]?.place).toBe('여의도 윤중로');
    expect(spots[0]?.thumbnailUrl).toBe('https://blob.example.com/cherry.jpg');
    expect(spots[0]?.flowerThumbnailUrl).toBe('https://blob.example.com/flower-cherry.jpg');
  });

  it('returns a single spot by slug', async () => {
    const spot = await getPublishedSpotBySlug('yeouido-yunjung-ro');

    expect(spot?.place).toBe('여의도 윤중로');
  });

  it('getTopSpots(10)은 now_score desc 순서의 FlowerSpot 배열을 반환한다', async () => {
    resetCallsFor('spots');
    const spots = await getTopSpots(10);

    expect(spots.length).toBe(topSpotRows.length);
    expect(spots[0]?.nowScore).toBe(95);
    expect(spots[0]?.nowScore).toBeGreaterThanOrEqual(spots[1]?.nowScore ?? 0);
    expect(spots[1]?.nowScore).toBeGreaterThanOrEqual(spots[2]?.nowScore ?? 0);

    // now_score DESC 정렬이 호출되어야 한다.
    const recorded = lastSpotsCalls.at(-1)!;
    expect(recorded.order.some(([col]) => col === 'now_score')).toBe(true);
  });

  it('getSpotContent은 videos 3개·blogs 5개 이하로 Date 객체를 포함해 반환한다', async () => {
    resetCallsFor('spots');
    resetCallsFor('spot_videos');
    resetCallsFor('spot_blogs');
    videoRowsOverride = null;
    blogRowsOverride = null;

    const content = await getSpotContent('yeouido-yunjung-ro');

    expect(content.videos.length).toBeLessThanOrEqual(3);
    expect(content.blogs.length).toBeLessThanOrEqual(5);

    expect(content.videos[0]?.videoId).toBe('vid-1');
    expect(content.videos[0]?.publishedAt).toBeInstanceOf(Date);
    expect(content.videos[0]?.publishedAt.toISOString()).toBe('2026-04-10T00:00:00.000Z');

    expect(content.blogs[0]?.url).toBe('https://b1');
    expect(content.blogs[0]?.postedAt).toBeInstanceOf(Date);
  });

  it("getSpotContent의 spot-id 조회 쿼리에 status='published' 필터가 걸린다", async () => {
    resetCallsFor('spots');
    videoRowsOverride = null;
    blogRowsOverride = null;

    await getSpotContent('yeouido-yunjung-ro');

    // getSpotContent가 첫 번째로 만드는 spots 체인이 id 조회 쿼리다.
    const spotIdCall = lastSpotsCalls[0]!;
    expect(spotIdCall.eq.some(([col, val]) => col === 'slug' && val === 'yeouido-yunjung-ro')).toBe(true);
    expect(spotIdCall.eq.some(([col, val]) => col === 'status' && val === 'published')).toBe(true);
  });

  it('spot_videos / spot_blogs 쿼리에 relevance_score DESC 정렬이 우선 호출된다', async () => {
    resetCallsFor('spots');
    resetCallsFor('spot_videos');
    resetCallsFor('spot_blogs');
    videoRowsOverride = null;
    blogRowsOverride = null;

    await getSpotContent('yeouido-yunjung-ro');

    const videoOrder = lastVideoCalls.at(-1)!.order;
    expect(videoOrder[0]?.[0]).toBe('relevance_score');
    expect(videoOrder.some(([col]) => col === 'published_at')).toBe(true);

    const blogOrder = lastBlogCalls.at(-1)!.order;
    expect(blogOrder[0]?.[0]).toBe('relevance_score');
    expect(blogOrder.some(([col]) => col === 'posted_at')).toBe(true);
  });

  it('spot_videos 결과에 published_at=null 또는 thumbnail_url=null row가 있어도 크래시하지 않고, published_at=null row는 제외된다', async () => {
    resetCallsFor('spots');
    resetCallsFor('spot_videos');
    resetCallsFor('spot_blogs');
    videoRowsOverride = [
      {
        video_id: 'vid-ok',
        title: '정상',
        channel_title: null,
        thumbnail_url: null, // 빈 문자열 fallback
        published_at: '2026-04-10T00:00:00Z',
      },
      {
        video_id: 'vid-no-date',
        title: '날짜 없음',
        channel_title: '채널',
        thumbnail_url: 'https://img/x.jpg',
        published_at: null, // 제외 대상
      },
    ];
    blogRowsOverride = [
      {
        url: 'https://ok',
        title: '정상',
        blogger_name: null, // 빈 문자열 fallback
        posted_at: '2026-04-10T00:00:00Z',
      },
      {
        url: 'https://no-date',
        title: '날짜 없음',
        blogger_name: '블로거',
        posted_at: null, // 제외 대상
      },
    ];

    const content = await getSpotContent('yeouido-yunjung-ro');

    // published_at/posted_at이 null인 row는 결과에서 제외되어야 한다.
    expect(content.videos).toHaveLength(1);
    expect(content.videos[0]?.videoId).toBe('vid-ok');
    expect(content.videos[0]?.channelTitle).toBe('');
    expect(content.videos[0]?.thumbnailUrl).toBe('');
    expect(content.videos[0]?.publishedAt).toBeInstanceOf(Date);
    expect(Number.isNaN(content.videos[0]?.publishedAt.getTime())).toBe(false);

    expect(content.blogs).toHaveLength(1);
    expect(content.blogs[0]?.url).toBe('https://ok');
    expect(content.blogs[0]?.bloggerName).toBe('');
    expect(content.blogs[0]?.postedAt).toBeInstanceOf(Date);
    expect(Number.isNaN(content.blogs[0]?.postedAt.getTime())).toBe(false);

    videoRowsOverride = null;
    blogRowsOverride = null;
  });
});
