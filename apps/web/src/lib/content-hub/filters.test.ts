import { describe, it, expect } from 'vitest';
import { filterVideos } from './filters';
import type { VideoItem, SpotContext } from './filters';

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

  it('viewCount 1000 미만 항목은 제거한다', () => {
    const items = [
      makeVideo({ videoId: 'v1', viewCount: 999 }),
      makeVideo({ videoId: 'v2', viewCount: 1000 }),
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
