import { describe, expect, it, vi } from 'vitest';

import { getPublicSpotBySlug, listPublicSpots } from './publicSpots';

describe('publicSpots', () => {
  it('lists only published public spots with flower metadata', async () => {
    const order = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'spot-1',
          slug: 'yeouido-yunjung-ro',
          name: '여의도 윤중로',
          region_secondary: '서울 영등포구',
          description: '벚꽃 산책 명소',
          short_tip: '평일 오전 추천',
          admission_fee: null,
          parking_info: '공영주차장',
          festival_start_at: null,
          festival_end_at: null,
          bloom_start_at: '2026-03-28',
          bloom_end_at: '2026-04-10',
          is_featured: true,
          latitude: 37.5259,
          longitude: 126.9226,
          thumbnail_url: null,
          flower: {
            name_ko: '벚꽃',
            thumbnail_url: null,
            is_active: true,
          },
        },
      ],
      error: null,
    });
    const eq = vi.fn().mockReturnValue({ order });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    const client = { from } as never;

    const result = await listPublicSpots(client);

    expect(from).toHaveBeenCalledWith('spots');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      slug: 'yeouido-yunjung-ro',
      place: '여의도 윤중로',
      flower: '벚꽃',
      location: '서울 영등포구',
      fee: '정보 없음',
      parking: '공영주차장',
      isFeatured: true,
    });
  });

  it('returns one public spot by slug', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'spot-2',
        slug: 'jeju-noksan-ro',
        name: '제주 녹산로',
        region_secondary: '제주 서귀포시',
        description: '유채꽃 드라이브 명소',
        short_tip: '노을 시간 추천',
        admission_fee: null,
        parking_info: null,
        festival_start_at: '2026-04-01',
        festival_end_at: '2026-04-07',
        bloom_start_at: '2026-03-29',
        bloom_end_at: '2026-04-20',
        is_featured: false,
        latitude: 33.387,
        longitude: 126.781,
        thumbnail_url: 'https://example.com/thumb.jpg',
        flower: {
          name_ko: '유채꽃',
          thumbnail_url: 'https://example.com/flower.jpg',
          is_active: true,
        },
      },
      error: null,
    });
    const eqSlug = vi.fn().mockReturnValue({ maybeSingle });
    const eqStatus = vi.fn().mockReturnValue({ eq: eqSlug });
    const select = vi.fn().mockReturnValue({ eq: eqStatus });
    const from = vi.fn().mockReturnValue({ select });
    const client = { from } as never;

    const result = await getPublicSpotBySlug(client, 'jeju-noksan-ro');

    expect(result?.slug).toBe('jeju-noksan-ro');
    expect(result?.festivalDate).toBe('2026.04.01 - 2026.04.07');
    expect(result?.parking).toBe('정보 없음');
  });
});
