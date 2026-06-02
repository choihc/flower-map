import { describe, expect, it, vi } from 'vitest';

import type { StayRow } from './types';

const stayRow: StayRow = {
  id: 'stay-1',
  slug: 'jeju-onsen-villa',
  name: '제주 온천 빌라',
  region_primary: '제주',
  region_secondary: '제주 서귀포시',
  address: '제주 서귀포시 어느로 1',
  latitude: 33.2541,
  longitude: 126.5601,
  stay_type: 'onsen',
  season_tags: ['겨울'],
  season_window_start: '11-01',
  season_window_end: '03-31',
  short_tagline: '겨울에 가장 빛나는 호캉스',
  description: '온천과 함께 쉬어가는 제주 호캉스',
  recommendation_points: ['실내 온천'],
  tripcom_booking_url: null,
  thumbnail_url: null,
  booking_query_override: null,
  naver_rating_score: 4.5,
  naver_rating_url: 'https://map.naver.com/stay-1',
  google_rating_score: null,
  google_rating_url: null,
  rating_captured_at: '2026-05-10',
  is_featured: true,
  display_order: 1,
};

const stayRows: StayRow[] = [
  stayRow,
  { ...stayRow, id: 'stay-2', slug: 'busan-resort', name: '부산 리조트', is_featured: false, display_order: 2 },
];

const videoRows = [
  {
    video_id: 'vid-1',
    title: '제주 호캉스 후기',
    channel_title: '여행 채널',
    thumbnail_url: 'https://img/1.jpg',
    published_at: '2026-04-10T00:00:00Z',
  },
  {
    video_id: 'vid-2',
    title: '제주 온천 호캉스',
    channel_title: '호캉스 채널',
    thumbnail_url: 'https://img/2.jpg',
    published_at: '2026-04-08T00:00:00Z',
  },
];

const blogRows = [
  { url: 'https://b1', title: '블로그1', blogger_name: '블로거1', posted_at: '2026-04-10T00:00:00Z' },
  { url: 'https://b2', title: '블로그2', blogger_name: '블로거2', posted_at: '2026-04-09T00:00:00Z' },
];

type AnyFn = (...args: unknown[]) => unknown;

type ChainCalls = {
  eq: Array<[string, unknown]>;
  order: Array<[string, unknown?]>;
};

const lastStaysCalls: ChainCalls[] = [];
const lastVideoCalls: ChainCalls[] = [];
const lastBlogCalls: ChainCalls[] = [];

function resetCallsFor(table: 'stays' | 'stay_videos' | 'stay_blogs') {
  if (table === 'stays') lastStaysCalls.length = 0;
  if (table === 'stay_videos') lastVideoCalls.length = 0;
  if (table === 'stay_blogs') lastBlogCalls.length = 0;
}

let staysMaybeSingleOverride: StayRow | null | undefined = undefined;
let staysListOverride: StayRow[] | null = null;
let videoRowsOverride: unknown[] | null = null;
let blogRowsOverride: unknown[] | null = null;

function makeStaysChain() {
  const recorded: ChainCalls = { eq: [], order: [] };
  lastStaysCalls.push(recorded);

  const chain: Record<string, AnyFn> & PromiseLike<unknown> = {
    select(..._args: unknown[]) {
      return chain;
    },
    eq(column: unknown, value: unknown) {
      recorded.eq.push([String(column), value]);
      return chain;
    },
    order(column: unknown, options?: unknown) {
      recorded.order.push([String(column), options]);
      return chain;
    },
    limit(..._args: unknown[]) {
      return chain;
    },
    maybeSingle() {
      const data = staysMaybeSingleOverride === undefined ? stayRow : staysMaybeSingleOverride;
      return Promise.resolve({ data, error: null });
    },
    then(onFulfilled?: (v: { data: unknown; error: unknown }) => unknown) {
      const data = staysListOverride ?? stayRows;
      return Promise.resolve({ data, error: null }).then(onFulfilled);
    },
  } as Record<string, AnyFn> & PromiseLike<unknown>;

  return chain;
}

function makeArrayChain(rows: unknown[], recorded?: ChainCalls) {
  const chain: Record<string, AnyFn> & PromiseLike<unknown> = {
    select(..._args: unknown[]) {
      return chain;
    },
    eq(column: unknown, value: unknown) {
      if (recorded) recorded.eq.push([String(column), value]);
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
    then(onFulfilled?: (v: { data: unknown; error: unknown }) => unknown) {
      return Promise.resolve({ data: rows, error: null }).then(onFulfilled);
    },
  } as Record<string, AnyFn> & PromiseLike<unknown>;

  return chain;
}

vi.mock('../lib/supabase', () => {
  return {
    supabase: {
      from: (table: string) => {
        if (table === 'stays') return makeStaysChain();
        if (table === 'stay_videos') {
          const recorded: ChainCalls = { eq: [], order: [] };
          lastVideoCalls.push(recorded);
          return makeArrayChain(videoRowsOverride ?? videoRows, recorded);
        }
        if (table === 'stay_blogs') {
          const recorded: ChainCalls = { eq: [], order: [] };
          lastBlogCalls.push(recorded);
          return makeArrayChain(blogRowsOverride ?? blogRows, recorded);
        }
        return makeArrayChain([]);
      },
    },
  };
});

import {
  getPublishedStayBySlug,
  getPublishedStays,
  getStayContent,
  stayKeys,
} from './stayRepository';

describe('stayRepository', () => {
  it('returns mapped Stay list from Supabase with published filter and ordering', async () => {
    resetCallsFor('stays');
    staysListOverride = null;

    const stays = await getPublishedStays();

    expect(stays).toHaveLength(2);
    expect(stays[0]?.id).toBe('stay-1');
    expect(stays[0]?.slug).toBe('jeju-onsen-villa');
    expect(stays[0]?.name).toBe('제주 온천 빌라');

    const recorded = lastStaysCalls.at(-1)!;
    expect(recorded.eq.some(([col, val]) => col === 'status' && val === 'published')).toBe(true);
    expect(recorded.order.some(([col]) => col === 'is_featured')).toBe(true);
    expect(recorded.order.some(([col]) => col === 'display_order')).toBe(true);
  });

  it('returns undefined from getPublishedStayBySlug when row is null', async () => {
    resetCallsFor('stays');
    staysMaybeSingleOverride = null;

    const stay = await getPublishedStayBySlug('missing-stay');

    expect(stay).toBeUndefined();

    staysMaybeSingleOverride = undefined;
  });

  it('returns mapped Stay from getPublishedStayBySlug when row exists', async () => {
    resetCallsFor('stays');
    staysMaybeSingleOverride = undefined;

    const stay = await getPublishedStayBySlug('jeju-onsen-villa');

    expect(stay?.id).toBe('stay-1');
    expect(stay?.slug).toBe('jeju-onsen-villa');
    expect(stay?.naverRating).toEqual({ score: 4.5, url: 'https://map.naver.com/stay-1' });
    expect(stay?.googleRating).toBeNull();

    const recorded = lastStaysCalls.at(-1)!;
    expect(recorded.eq.some(([col, val]) => col === 'slug' && val === 'jeju-onsen-villa')).toBe(true);
    expect(recorded.eq.some(([col, val]) => col === 'status' && val === 'published')).toBe(true);
  });

  it('getStayContent returns empty arrays when stay row is missing', async () => {
    resetCallsFor('stays');
    staysMaybeSingleOverride = null;

    const content = await getStayContent('missing-stay');

    expect(content.videos).toEqual([]);
    expect(content.blogs).toEqual([]);

    staysMaybeSingleOverride = undefined;
  });

  it('getStayContent returns mapped videos and blogs in parallel with Date objects', async () => {
    resetCallsFor('stays');
    resetCallsFor('stay_videos');
    resetCallsFor('stay_blogs');
    staysMaybeSingleOverride = undefined;
    videoRowsOverride = null;
    blogRowsOverride = null;

    const content = await getStayContent('jeju-onsen-villa');

    expect(content.videos.length).toBeLessThanOrEqual(6);
    expect(content.blogs.length).toBeLessThanOrEqual(5);

    expect(content.videos[0]?.videoId).toBe('vid-1');
    expect(content.videos[0]?.publishedAt).toBeInstanceOf(Date);
    expect(content.videos[0]?.publishedAt.toISOString()).toBe('2026-04-10T00:00:00.000Z');

    expect(content.blogs[0]?.url).toBe('https://b1');
    expect(content.blogs[0]?.postedAt).toBeInstanceOf(Date);
  });

  it('getStayContent excludes rows with null published_at / posted_at', async () => {
    resetCallsFor('stays');
    resetCallsFor('stay_videos');
    resetCallsFor('stay_blogs');
    staysMaybeSingleOverride = undefined;
    videoRowsOverride = [
      {
        video_id: 'vid-ok',
        title: '정상',
        channel_title: null,
        thumbnail_url: null,
        published_at: '2026-04-10T00:00:00Z',
      },
      {
        video_id: 'vid-no-date',
        title: '날짜 없음',
        channel_title: '채널',
        thumbnail_url: 'https://img/x.jpg',
        published_at: null,
      },
    ];
    blogRowsOverride = [
      {
        url: 'https://ok',
        title: '정상',
        blogger_name: null,
        posted_at: '2026-04-10T00:00:00Z',
      },
      {
        url: 'https://no-date',
        title: '날짜 없음',
        blogger_name: '블로거',
        posted_at: null,
      },
    ];

    const content = await getStayContent('jeju-onsen-villa');

    expect(content.videos).toHaveLength(1);
    expect(content.videos[0]?.videoId).toBe('vid-ok');
    expect(content.videos[0]?.channelTitle).toBe('');
    expect(content.videos[0]?.thumbnailUrl).toBe('');

    expect(content.blogs).toHaveLength(1);
    expect(content.blogs[0]?.url).toBe('https://ok');
    expect(content.blogs[0]?.bloggerName).toBe('');

    videoRowsOverride = null;
    blogRowsOverride = null;
  });

  it('stayKeys.detail / content return stable keys per slug', () => {
    expect(stayKeys.all).toEqual(['stays']);
    expect(stayKeys.detail('abc')).toEqual(['stays', 'abc']);
    expect(stayKeys.content('abc')).toEqual(['stays', 'content', 'abc']);
  });
});
