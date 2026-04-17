import { describe, expect, it } from 'vitest';

import { toFlowerSpot } from './spotMappers';

const baseRow = {
  id: 'spot-1',
  slug: 'yeouido-yunjung-ro',
  name: '여의도 윤중로',
  flower: { name_ko: '벚꽃', thumbnail_url: null },
  region_secondary: '서울 영등포구',
  description: '한강 바람을 따라 걷기 좋은 서울 대표 벚꽃 산책 코스',
  short_tip: '산책 동선이 좋고 축제 분위기가 살아 있는 대표 스팟',
  admission_fee: '무료',
  parking_info: '인근 공영주차장 이용 권장',
  festival_start_at: '2026-04-01',
  festival_end_at: '2026-04-07',
  bloom_start_at: '2026-03-28',
  bloom_end_at: '2026-04-10',
  is_featured: true,
  latitude: 37.5288,
  longitude: 126.9291,
  thumbnail_url: null,
};

describe('toFlowerSpot', () => {
  it('keeps the database id and exposes slug separately for route lookups', () => {
    const result = toFlowerSpot(baseRow);

    expect(result.id).toBe('spot-1');
    expect(result.slug).toBe('yeouido-yunjung-ro');
    expect(result.place).toBe('여의도 윤중로');
    expect(result.flower).toBe('벚꽃');
    expect(result.badge).toBe('이번 주 절정');
    expect(result.festivalDate).toBe('2026.04.01 - 2026.04.07');
  });

  it('maps thumbnail_url to thumbnailUrl — null when absent', () => {
    const withNull = toFlowerSpot({ ...baseRow, thumbnail_url: null });
    expect(withNull.thumbnailUrl).toBeNull();

    const withUrl = toFlowerSpot({
      ...baseRow,
      thumbnail_url: 'https://blob.example.com/cherry.jpg',
    });
    expect(withUrl.thumbnailUrl).toBe('https://blob.example.com/cherry.jpg');
  });

  it('maps flower.thumbnail_url to flowerThumbnailUrl', () => {
    const withNull = toFlowerSpot({ ...baseRow, flower: { name_ko: '벚꽃', thumbnail_url: null } });
    expect(withNull.flowerThumbnailUrl).toBeNull();

    const withUrl = toFlowerSpot({
      ...baseRow,
      flower: { name_ko: '벚꽃', thumbnail_url: 'https://blob.example.com/flower-cherry.jpg' },
    });
    expect(withUrl.flowerThumbnailUrl).toBe('https://blob.example.com/flower-cherry.jpg');
  });

  it('maps now_score 계열 필드가 모두 존재할 때 FlowerSpot에 매핑한다', () => {
    const withScores = toFlowerSpot({
      ...baseRow,
      bloom_score: 82,
      trend_score: 71,
      content_score: 60,
      yoy_score: 75,
      now_score: 79,
      now_score_at: '2026-04-17T03:00:00Z',
    } as never);

    expect(withScores.bloomScore).toBe(82);
    expect(withScores.trendScore).toBe(71);
    expect(withScores.yoyScore).toBe(75);
    expect(withScores.nowScore).toBe(79);
    expect(withScores.nowScoreAt).toBeInstanceOf(Date);
    expect(withScores.nowScoreAt?.toISOString()).toBe('2026-04-17T03:00:00.000Z');
  });

  it('Supabase가 NUMERIC 값을 문자열로 반환해도 Number로 변환된다', () => {
    // PostgREST가 NUMERIC(5,2)을 문자열 "79.50"로 직렬화할 수 있음에 대비.
    const withStringScores = toFlowerSpot({
      ...baseRow,
      bloom_score: '82.00',
      trend_score: '71.25',
      yoy_score: '75.50',
      now_score: '79.50',
    } as never);

    expect(withStringScores.bloomScore).toBe(82);
    expect(withStringScores.trendScore).toBe(71.25);
    expect(withStringScores.yoyScore).toBe(75.5);
    expect(withStringScores.nowScore).toBe(79.5);
    expect(typeof withStringScores.nowScore).toBe('number');
  });

  it('maps now_score 계열 필드가 null/누락이면 undefined로 둔다', () => {
    const nullScores = toFlowerSpot({
      ...baseRow,
      bloom_score: null,
      trend_score: null,
      yoy_score: null,
      now_score: null,
      now_score_at: null,
    } as never);

    expect(nullScores.bloomScore).toBeUndefined();
    expect(nullScores.trendScore).toBeUndefined();
    expect(nullScores.yoyScore).toBeUndefined();
    expect(nullScores.nowScore).toBeUndefined();
    expect(nullScores.nowScoreAt).toBeUndefined();

    const missingScores = toFlowerSpot(baseRow);
    expect(missingScores.bloomScore).toBeUndefined();
    expect(missingScores.nowScore).toBeUndefined();
    expect(missingScores.nowScoreAt).toBeUndefined();
  });

  it('derives fallback presentation labels from raw row data', () => {
    const result = toFlowerSpot(
      {
        ...baseRow,
        id: 'spot-2',
        slug: 'jeju-noksan-ro',
        name: '제주 녹산로',
        flower: { name_ko: '유채꽃', thumbnail_url: null },
        region_secondary: '제주 서귀포시',
        description: '도로를 따라 길게 펼쳐지는 유채꽃 풍경이 인상적인 드라이브 코스',
        short_tip: '넓게 펼쳐진 노란 들판과 드라이브 감성이 좋은 코스',
        festival_start_at: '2026-03-20',
        festival_end_at: '2026-04-15',
        bloom_start_at: '2026-03-20',
        bloom_end_at: '2026-04-20',
        is_featured: false,
        latitude: 33.4342,
        longitude: 126.6735,
      },
      new Date('2026-03-29T00:00:00Z'),
    );

    expect(result.badge).toBe('지금 방문 추천');
    expect(result.bloomStatus).toBe('포토 스팟');
    expect(result.eventEndsIn).toBe('D-18');
    expect(result.tone).toBe('yellow');
  });
});
