import { describe, expect, it } from 'vitest';

import { mapSpotRow } from '../mappers/mapSpotRow';

const row = {
  id: 'spot-1',
  slug: 'yeouido-hangang-park',
  name: '여의도 한강공원',
  flower: {
    name_ko: '벚꽃',
    thumbnail_url: 'https://example.com/flower.jpg',
  },
  region_secondary: '서울 영등포구',
  description: '봄마다 벚꽃 산책을 즐기기 좋은 공원입니다.',
  short_tip: '평일 오전에 방문하면 비교적 한적합니다.',
  admission_fee: null,
  parking_info: null,
  festival_start_at: '2026-04-01',
  festival_end_at: '2026-04-07',
  bloom_start_at: '2026-03-28',
  bloom_end_at: '2026-04-10',
  is_featured: true,
  latitude: 37.5288,
  longitude: 126.9291,
  thumbnail_url: 'https://example.com/spot.jpg',
};

describe('mapSpotRow', () => {
  it('Supabase row를 화면용 spot 모델로 변환합니다', () => {
    const spot = mapSpotRow(row, new Date('2026-04-03T00:00:00Z'));

    expect(spot.id).toBe('spot-1');
    expect(spot.slug).toBe('yeouido-hangang-park');
    expect(spot.place).toBe('여의도 한강공원');
    expect(spot.flower).toBe('벚꽃');
    expect(spot.location).toBe('서울 영등포구');
    expect(spot.helper).toBe('평일 오전에 방문하면 비교적 한적합니다.');
    expect(spot.thumbnailUrl).toBe('https://example.com/spot.jpg');
    expect(spot.flowerThumbnailUrl).toBe('https://example.com/flower.jpg');
    expect(spot.parking).toBe('정보 없음');
    expect(spot.fee).toBe('정보 없음');
    expect(spot.festivalDate).toBe('2026.04.01 - 2026.04.07');
    expect(spot.badge).toBe('이번 주 절정');
    expect(spot.bloomStatus).toBe('지금 보기 좋아요');
    expect(spot.eventEndsIn).toBe('D-5');
    expect(spot.tone).toBe('pink');
  });

  it('null 값이 있으면 기존 앱 규칙에 맞는 fallback을 사용합니다', () => {
    const spot = mapSpotRow(
      {
        ...row,
        flower: {
          name_ko: '유채꽃',
          thumbnail_url: null,
        },
        admission_fee: null,
        parking_info: null,
        festival_start_at: null,
        festival_end_at: null,
        thumbnail_url: null,
      },
      new Date('2026-03-10T00:00:00Z'),
    );

    expect(spot.thumbnailUrl).toBeNull();
    expect(spot.flowerThumbnailUrl).toBeNull();
    expect(spot.parking).toBe('정보 없음');
    expect(spot.festivalDate).toBe('일정 미정');
    expect(spot.badge).toBe('지금 방문 추천');
    expect(spot.bloomStatus).toBe('개화 예정');
    expect(spot.eventEndsIn).toBeUndefined();
    expect(spot.tone).toBe('yellow');
  });
});
