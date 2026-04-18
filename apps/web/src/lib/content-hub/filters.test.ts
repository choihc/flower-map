import { describe, it, expect } from 'vitest';
import { filterBlogs, filterVideos } from './filters';
import type { BlogItem, SpotContext, VideoItem } from './filters';

function makeVideo(overrides: Partial<VideoItem> = {}): VideoItem {
  return {
    videoId: 'v-default',
    title: '여의도 벚꽃 축제',
    description: '여의도 벚꽃 명소 방문',
    channelTitle: '기본채널',
    channelId: 'c-default',
    publishedAt: new Date('2026-04-01T00:00:00Z'),
    viewCount: 5000,
    thumbnailUrl: 'https://img/thumb.jpg',
    ...overrides,
  };
}

const spot: SpotContext = {
  name: '여의도',
  flower: '벚꽃',
  aliases: ['사쿠라', 'cherry blossom'],
  excludeKeywords: ['광고', ''],
};

describe('filterVideos', () => {
  it('명소명이 제목/설명에 없는 항목은 제거한다', () => {
    const items = [
      makeVideo({ videoId: 'v1' }),
      makeVideo({ videoId: 'v2', title: '남산 벚꽃', description: '남산 방문' }),
    ];
    const result = filterVideos(items, spot);
    expect(result.map((i) => i.videoId)).toEqual(['v1']);
  });

  it('명소명의 공백 표기 차이는 무시하고 매칭한다 ("여의도 윤중로" ↔ "여의도윤중로")', () => {
    const longSpot = { ...spot, name: '여의도 윤중로' };
    const items = [
      makeVideo({ videoId: 'v1', channelId: 'ch-a', title: '여의도윤중로 벚꽃 산책' }),
      makeVideo({ videoId: 'v2', channelId: 'ch-b', title: '여의도 　 윤중로 브이로그' }),
    ];
    const result = filterVideos(items, longSpot);
    expect(result.map((i) => i.videoId).sort()).toEqual(['v1', 'v2']);
  });

  it('3토큰 명소는 절반(2개) 토큰만 매칭되어도 통과한다', () => {
    const longSpot = { ...spot, name: '창원 진해 군항제' };
    const items = [
      makeVideo({ videoId: 'pass', channelId: 'c-pass', title: '진해 군항제 벚꽃 2026' }),
      makeVideo({ videoId: 'fail', channelId: 'c-fail', title: '창원 여행 브이로그' }),
    ];
    const result = filterVideos(items, longSpot);
    expect(result.map((i) => i.videoId)).toEqual(['pass']);
  });

  it('괄호 별칭도 매칭 대상이 된다 ("매헌시민의숲 (양재 시민의숲)")', () => {
    const aliasSpot = { ...spot, name: '매헌시민의숲 (양재 시민의숲)' };
    const items = [
      makeVideo({ videoId: 'alias', channelId: 'ch-a', title: '양재 시민의숲 벚꽃 산책' }),
      makeVideo({ videoId: 'main', channelId: 'ch-b', title: '매헌시민의숲 2026' }),
    ];
    const result = filterVideos(items, aliasSpot);
    expect(result.map((i) => i.videoId).sort()).toEqual(['alias', 'main']);
  });

  it('2토큰 명소는 한 토큰만 일치해도 통과한다 ("경주 불국사" → "불국사 관람")', () => {
    const twoSpot = { ...spot, name: '경주 불국사' };
    const items = [makeVideo({ videoId: 'keep', title: '불국사 관람 브이로그' })];
    const result = filterVideos(items, twoSpot);
    expect(result).toHaveLength(1);
  });

  it('viewCount 300 미만 항목은 제거한다', () => {
    const items = [
      makeVideo({ videoId: 'v1', viewCount: 299 }),
      makeVideo({ videoId: 'v2', viewCount: 300 }),
    ];
    const result = filterVideos(items, spot);
    expect(result.map((i) => i.videoId)).toEqual(['v2']);
  });

  it('동일 channelId 항목은 publishedAt 최신 1개만 유지한다', () => {
    const items = [
      makeVideo({
        videoId: 'old',
        channelId: 'cc',
        publishedAt: new Date('2026-01-01T00:00:00Z'),
      }),
      makeVideo({
        videoId: 'new',
        channelId: 'cc',
        publishedAt: new Date('2026-03-01T00:00:00Z'),
      }),
    ];
    const result = filterVideos(items, spot);
    expect(result).toHaveLength(1);
    expect(result[0].videoId).toBe('new');
  });

  it('제목/설명에 꽃 이름 포함 시 relevanceScore는 0.7이다', () => {
    const items = [
      makeVideo({
        videoId: 'with-flower',
        title: '여의도 벚꽃 명소',
        description: '봄 나들이',
      }),
    ];
    const result = filterVideos(items, spot);
    expect(result[0].relevanceScore).toBeCloseTo(0.7, 5);
  });

  it('꽃 이름/유의어가 전혀 없으면 relevanceScore는 0.5이다', () => {
    const items = [
      makeVideo({
        videoId: 'no-flower',
        title: '여의도 여행',
        description: '여의도 맛집 투어',
      }),
    ];
    const result = filterVideos(items, spot);
    expect(result[0].relevanceScore).toBeCloseTo(0.5, 5);
  });

  it('유의어(aliases) 포함 시 relevanceScore는 0.7이다', () => {
    const items = [
      makeVideo({
        videoId: 'alias',
        title: '여의도 사쿠라',
        description: '봄 나들이',
      }),
    ];
    const result = filterVideos(items, spot);
    expect(result[0].relevanceScore).toBeCloseTo(0.7, 5);
  });

  it('제외 키워드 포함 항목은 제거한다', () => {
    const items = [
      makeVideo({
        videoId: 'ad',
        title: '여의도 벚꽃 광고',
      }),
      makeVideo({ videoId: 'ok' }),
    ];
    const result = filterVideos(items, spot);
    expect(result.map((i) => i.videoId)).toEqual(['ok']);
  });

  it('5개 중 최대 3개만 반환하며 정렬 순서는 relevance DESC, publishedAt DESC이다', () => {
    const items = [
      makeVideo({
        videoId: 'a',
        channelId: 'c1',
        title: '여의도',
        description: '여행',
        publishedAt: new Date('2026-03-01T00:00:00Z'),
      }),
      makeVideo({
        videoId: 'b',
        channelId: 'c2',
        title: '여의도 벚꽃',
        description: '봄 여행',
        publishedAt: new Date('2026-03-02T00:00:00Z'),
      }),
      makeVideo({
        videoId: 'c',
        channelId: 'c3',
        title: '여의도 벚꽃 명소',
        description: '한강 산책',
        publishedAt: new Date('2026-03-05T00:00:00Z'),
      }),
      makeVideo({
        videoId: 'd',
        channelId: 'c4',
        title: '여의도 한강',
        description: '피크닉',
        publishedAt: new Date('2026-03-04T00:00:00Z'),
      }),
      makeVideo({
        videoId: 'e',
        channelId: 'c5',
        title: '여의도 맛집',
        description: '먹거리',
        publishedAt: new Date('2026-03-03T00:00:00Z'),
      }),
    ];
    const result = filterVideos(items, spot);
    expect(result).toHaveLength(3);
    expect(result.map((i) => i.videoId)).toEqual(['c', 'b', 'd']);
  });

  it('원본 배열/객체를 변경하지 않는다 (순수 함수)', () => {
    const original = makeVideo({ videoId: 'pure' });
    const snapshot = { ...original };
    filterVideos([original], spot);
    expect(original).toEqual(snapshot);
    expect(original.relevanceScore).toBeUndefined();
  });
});

function blogUrlOf(id: string): string {
  if (id.startsWith('http')) return id;
  return `https://blog.naver.com/tester/${encodeURIComponent(id)}`;
}

function makeBlog(overrides: Partial<BlogItem> = {}): BlogItem {
  const { url, ...rest } = overrides;
  return {
    url: url ? blogUrlOf(url) : 'https://blog.naver.com/tester/default',
    title: '여의도 벚꽃 다녀왔어요',
    description: '여의도 벚꽃 구경',
    bloggerName: '기본블로거',
    postedAt: new Date('2026-04-01T00:00:00Z'),
    ...rest,
  };
}

describe('filterBlogs', () => {
  const now = new Date('2026-04-17T00:00:00Z');

  it('title에 명소명이 없으면 제거한다', () => {
    const items = [
      makeBlog({ url: 'u1' }),
      makeBlog({ url: 'u2', title: '남산 벚꽃 탐방' }),
    ];
    const result = filterBlogs(items, spot, now);
    expect(result.map((i) => i.url)).toEqual([blogUrlOf('u1')]);
  });

  it('12개월(365일)을 초과한 postedAt은 제거한다', () => {
    const items = [
      makeBlog({
        url: 'too-old',
        postedAt: new Date('2025-04-16T00:00:00Z'),
      }),
      makeBlog({
        url: 'just-in',
        postedAt: new Date('2025-04-18T00:00:00Z'),
      }),
    ];
    const result = filterBlogs(items, spot, now);
    expect(result.map((i) => i.url)).toEqual([blogUrlOf('just-in')]);
  });

  it('동일 bloggerName은 최신 1개만 유지한다', () => {
    const items = [
      makeBlog({
        url: 'old',
        bloggerName: 'b1',
        postedAt: new Date('2026-01-01T00:00:00Z'),
      }),
      makeBlog({
        url: 'new',
        bloggerName: 'b1',
        postedAt: new Date('2026-03-01T00:00:00Z'),
      }),
    ];
    const result = filterBlogs(items, spot, now);
    expect(result).toHaveLength(1);
    expect(result[0].url).toBe(blogUrlOf('new'));
  });

  it('꽃 유의어 포함 시 relevanceScore는 0.7이다', () => {
    const items = [
      makeBlog({
        url: 'alias',
        title: '여의도 사쿠라 만개',
        description: '봄 나들이',
      }),
    ];
    const result = filterBlogs(items, spot, now);
    expect(result[0].relevanceScore).toBeCloseTo(0.7, 5);
  });

  it('꽃 이름/유의어가 없으면 relevanceScore는 0.5이다', () => {
    const items = [
      makeBlog({
        url: 'no-flower',
        title: '여의도 맛집 탐방',
        description: '여의도 한강 산책',
      }),
    ];
    const result = filterBlogs(items, spot, now);
    expect(result[0].relevanceScore).toBeCloseTo(0.5, 5);
  });

  it('제외 키워드 포함 시 제거한다', () => {
    const items = [
      makeBlog({
        url: 'ad',
        title: '여의도 벚꽃 광고 포스팅',
      }),
      makeBlog({ url: 'ok' }),
    ];
    const result = filterBlogs(items, spot, now);
    expect(result.map((i) => i.url)).toEqual([blogUrlOf('ok')]);
  });

  it('7개 중 최대 5개만 반환하며 relevance DESC, postedAt DESC 순으로 정렬된다', () => {
    const items = [
      makeBlog({
        url: 'a',
        bloggerName: 'b1',
        title: '여의도 벚꽃 명소',
        description: '한강 피크닉',
        postedAt: new Date('2026-03-10T00:00:00Z'),
      }),
      makeBlog({
        url: 'b',
        bloggerName: 'b2',
        title: '여의도 봄 여행',
        description: '맛집 리뷰',
        postedAt: new Date('2026-03-09T00:00:00Z'),
      }),
      makeBlog({
        url: 'c',
        bloggerName: 'b3',
        title: '여의도 한강',
        description: '자전거',
        postedAt: new Date('2026-03-08T00:00:00Z'),
      }),
      makeBlog({
        url: 'd',
        bloggerName: 'b4',
        title: '여의도 사쿠라 핀 곳',
        description: '봄',
        postedAt: new Date('2026-03-07T00:00:00Z'),
      }),
      makeBlog({
        url: 'e',
        bloggerName: 'b5',
        title: '여의도 드라이브',
        description: '야경',
        postedAt: new Date('2026-03-06T00:00:00Z'),
      }),
      makeBlog({
        url: 'f',
        bloggerName: 'b6',
        title: '여의도 카페',
        description: '디저트',
        postedAt: new Date('2026-03-05T00:00:00Z'),
      }),
      makeBlog({
        url: 'g',
        bloggerName: 'b7',
        title: '여의도 쇼핑',
        description: '후기',
        postedAt: new Date('2026-03-04T00:00:00Z'),
      }),
    ];
    const result = filterBlogs(items, spot, now);
    expect(result).toHaveLength(5);
    expect(result.map((i) => i.url)).toEqual(
      ['a', 'd', 'b', 'c', 'e'].map(blogUrlOf),
    );
  });

  it('빈 excludeKeywords 항목("")은 모든 항목을 제거하지 않는다', () => {
    const localSpot: SpotContext = { ...spot, excludeKeywords: [''] };
    const items = [makeBlog({ url: 'ok' })];
    const result = filterBlogs(items, localSpot, now);
    expect(result.map((i) => i.url)).toEqual([blogUrlOf('ok')]);
  });

  it('전각공백만 있는 excludeKeywords는 무시된다', () => {
    const localSpot: SpotContext = { ...spot, excludeKeywords: ['\u3000'] };
    const items = [makeBlog({ url: 'ok' })];
    const result = filterBlogs(items, localSpot, now);
    expect(result.map((i) => i.url)).toEqual([blogUrlOf('ok')]);
  });

  it('제외 키워드는 대소문자 무시로 매칭된다', () => {
    const localSpot: SpotContext = { ...spot, excludeKeywords: ['SALE'] };
    const items = [
      makeBlog({
        url: 'ad',
        title: '여의도 벚꽃 sale 포스팅',
      }),
    ];
    const result = filterBlogs(items, localSpot, now);
    expect(result).toHaveLength(0);
  });

  it('허용되지 않은 호스트(evil.com)는 제거된다', () => {
    const items = [
      makeBlog({ url: 'https://evil.com/post/1' }),
      makeBlog({ url: 'https://blog.naver.com/ok/1' }),
    ];
    const result = filterBlogs(items, spot, now);
    expect(result.map((i) => i.url)).toEqual(['https://blog.naver.com/ok/1']);
  });

  it('tistory 서브도메인은 허용된다', () => {
    const items = [
      makeBlog({ url: 'https://foo.tistory.com/123' }),
    ];
    const result = filterBlogs(items, spot, now);
    expect(result.map((i) => i.url)).toEqual(['https://foo.tistory.com/123']);
  });

  it('malformed URL은 제거된다', () => {
    const items = [
      { ...makeBlog({ url: 'ok' }), url: 'not-a-url' } as BlogItem,
      makeBlog({ url: 'ok2' }),
    ];
    const result = filterBlogs(items, spot, now);
    expect(result.map((i) => i.url)).toEqual([blogUrlOf('ok2')]);
  });

  it('원본 객체를 변경하지 않는다 (순수 함수)', () => {
    const original = makeBlog({ url: 'pure' });
    const snapshot = { ...original };
    filterBlogs([original], spot, now);
    expect(original).toEqual(snapshot);
    expect(original.relevanceScore).toBeUndefined();
  });
});
