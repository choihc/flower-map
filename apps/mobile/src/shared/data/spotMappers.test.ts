import { describe, expect, it } from 'vitest';

import { toFlowerSpot } from './spotMappers';

const baseRow = {
  id: 'spot-1',
  slug: 'yeouido-yunjung-ro',
  name: '여의도 윤중로',
  flower: { name_ko: '벚꽃' },
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

  it('derives fallback presentation labels from raw row data', () => {
    const result = toFlowerSpot(
      {
        ...baseRow,
        id: 'spot-2',
        slug: 'jeju-noksan-ro',
        name: '제주 녹산로',
        flower: { name_ko: '유채꽃' },
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
