import { describe, expect, it } from 'vitest';

import { importPayloadSchema } from './importSchema';

describe('importPayloadSchema', () => {
  it('accepts flower with multiple spots', () => {
    const result = importPayloadSchema.safeParse({
      flower: {
        slug: 'cherry-blossom',
        name_ko: '벚꽃',
        color_hex: '#F6B7C1',
        season_start_month: 3,
        season_end_month: 4,
      },
      spots: [
        {
          slug: 'yeouido-yunjung-ro',
          name: '여의도 윤중로',
          region_primary: '서울/경기',
          region_secondary: '서울 영등포구',
          address: '서울특별시 영등포구 여의서로 일대',
          latitude: 37.5259,
          longitude: 126.9226,
          description: '설명',
          short_tip: '팁',
          bloom_start_at: '2026-03-28',
          bloom_end_at: '2026-04-10',
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('accepts a single spot with a flower slug', () => {
    const result = importPayloadSchema.safeParse({
      flower_slug: 'cherry-blossom',
      spot: {
        slug: 'yeouido-yunjung-ro',
        name: '여의도 윤중로',
        region_primary: '서울/경기',
        region_secondary: '서울 영등포구',
        address: '서울특별시 영등포구 여의서로 일대',
        latitude: 37.5259,
        longitude: 126.9226,
        description: '설명',
        short_tip: '팁',
        bloom_start_at: '2026-03-28',
        bloom_end_at: '2026-04-10',
      },
    });

    expect(result.success).toBe(true);
  });

  it('accepts an empty thumbnail url and normalizes it to absent', () => {
    const result = importPayloadSchema.safeParse({
      flower_slug: 'cherry-blossom',
      spot: {
        slug: 'yeouido-yunjung-ro',
        name: '여의도 윤중로',
        region_primary: '서울/경기',
        region_secondary: '서울 영등포구',
        address: '서울특별시 영등포구 여의서로 일대',
        latitude: 37.5259,
        longitude: 126.9226,
        description: '설명',
        short_tip: '팁',
        thumbnail_url: '',
        bloom_start_at: '2026-03-28',
        bloom_end_at: '2026-04-10',
      },
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      throw new Error('Expected import payload to parse successfully');
    }

    if (!('spot' in result.data)) {
      throw new Error('Expected single-spot payload to contain spot');
    }

    expect(result.data.spot.thumbnail_url).toBeUndefined();
  });

  it('accepts photos array in spot', () => {
    const result = importPayloadSchema.safeParse({
      flower_slug: 'cherry-blossom',
      spot: {
        slug: 'yeouido-yunjung-ro',
        name: '여의도 윤중로',
        region_primary: '서울/경기',
        region_secondary: '서울 영등포구',
        address: '서울특별시 영등포구 여의서로 일대',
        latitude: 37.5259,
        longitude: 126.9226,
        description: '설명',
        short_tip: '팁',
        bloom_start_at: '2026-03-28',
        bloom_end_at: '2026-04-10',
        photos: [
          { url: 'https://example.com/photo1.jpg', sort_order: 0, caption: '전경' },
          { url: 'https://example.com/photo2.jpg', sort_order: 1 },
        ],
      },
    });
    expect(result.success).toBe(true);
    if (!result.success) throw new Error('Expected parse success');
    if (!('spot' in result.data)) throw new Error('Expected single-spot payload');
    expect(result.data.spot.photos).toHaveLength(2);
    expect(result.data.spot.photos[0].url).toBe('https://example.com/photo1.jpg');
  });

  it('accepts a stay payload', () => {
    const result = importPayloadSchema.safeParse({
      stay: {
        slug: 'hotel-naru-magok',
        name: '호텔 나루 서울 마곡',
        region_primary: '서울',
        region_secondary: '강서',
        address: '서울 강서구 마곡중앙8로 38',
        latitude: 37.56,
        longitude: 126.82,
        stay_type: 'city',
        short_tagline: '도심 한강뷰 호텔',
        description: '인피니티풀과 스카이라운지에서 한강 야경을 즐길 수 있어요.',
      },
    });
    expect(result.success).toBe(true);
    if (!result.success) throw new Error('Expected parse success');
    if (!('stay' in result.data)) throw new Error('Expected stay payload');
    expect(result.data.stay.status).toBe('draft');
    expect(result.data.stay.is_featured).toBe(false);
  });

  it('rejects a stay payload missing required fields', () => {
    const result = importPayloadSchema.safeParse({
      stay: {
        slug: 'incomplete',
        name: '미완성',
      },
    });
    expect(result.success).toBe(false);
  });

  it('defaults photos to empty array when omitted', () => {
    const result = importPayloadSchema.safeParse({
      flower_slug: 'cherry-blossom',
      spot: {
        slug: 'yeouido-yunjung-ro',
        name: '여의도 윤중로',
        region_primary: '서울/경기',
        region_secondary: '서울 영등포구',
        address: '서울특별시 영등포구 여의서로 일대',
        latitude: 37.5259,
        longitude: 126.9226,
        description: '설명',
        short_tip: '팁',
        bloom_start_at: '2026-03-28',
        bloom_end_at: '2026-04-10',
      },
    });
    expect(result.success).toBe(true);
    if (!result.success) throw new Error('Expected parse success');
    if (!('spot' in result.data)) throw new Error('Expected single-spot payload');
    expect(result.data.spot.photos).toEqual([]);
  });
});
