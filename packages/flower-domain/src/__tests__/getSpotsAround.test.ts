import { describe, expect, it, vi } from 'vitest';

const rows = [
  {
    id: 'near-1',
    slug: 'yeouido-park',
    name: '여의도 공원',
    flower: { name_ko: '벚꽃', thumbnail_url: null },
    region_secondary: '서울 영등포구',
    description: '도심 속 공원',
    short_tip: '산책하기 좋습니다.',
    admission_fee: '무료',
    parking_info: null,
    festival_start_at: null,
    festival_end_at: null,
    bloom_start_at: '2026-03-28',
    bloom_end_at: '2026-04-10',
    is_featured: true,
    latitude: 37.5289,
    longitude: 126.9292,
    thumbnail_url: null,
  },
  {
    id: 'near-2',
    slug: 'seonyudo-park',
    name: '선유도공원',
    flower: { name_ko: '벚꽃', thumbnail_url: null },
    region_secondary: '서울 영등포구',
    description: '강변 공원',
    short_tip: '노을이 좋습니다.',
    admission_fee: '무료',
    parking_info: null,
    festival_start_at: null,
    festival_end_at: null,
    bloom_start_at: '2026-03-28',
    bloom_end_at: '2026-04-10',
    is_featured: false,
    latitude: 37.5431,
    longitude: 126.9014,
    thumbnail_url: null,
  },
  {
    id: 'far-1',
    slug: 'busan-park',
    name: '부산 공원',
    flower: { name_ko: '벚꽃', thumbnail_url: null },
    region_secondary: '부산 수영구',
    description: '바다 근처 공원',
    short_tip: '드라이브 코스입니다.',
    admission_fee: '무료',
    parking_info: null,
    festival_start_at: null,
    festival_end_at: null,
    bloom_start_at: '2026-03-28',
    bloom_end_at: '2026-04-10',
    is_featured: false,
    latitude: 35.1531,
    longitude: 129.1187,
    thumbnail_url: null,
  },
];

const { from } = vi.hoisted(() => {
  const eq = vi.fn(() => ({
    order: vi.fn(async () => ({ data: rows, error: null })),
  }));

  const select = vi.fn(() => ({ eq }));

  return {
    from: vi.fn(() => ({ select })),
  };
});

vi.mock('@flower-map/supabase', () => ({
  supabase: { from },
}));

import { getSpotsAround } from '../queries/getSpotsAround';

describe('getSpotsAround', () => {
  it('반경 안의 spot만 거리순으로 반환합니다', async () => {
    const spots = await getSpotsAround({
      latitude: 37.5288,
      longitude: 126.9291,
      radiusKm: 5,
    });

    expect(from).toHaveBeenCalledWith('spots');
    expect(spots.map((spot) => spot.id)).toEqual(['near-1', 'near-2']);
    expect(spots.every((spot) => spot.location === '서울 영등포구')).toBe(true);
  });

  it('limit이 0이면 빈 배열을 반환합니다', async () => {
    const spots = await getSpotsAround({
      latitude: 37.5288,
      longitude: 126.9291,
      radiusKm: 5,
      limit: 0,
    });

    expect(spots).toEqual([]);
  });
});
