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
    if (result.success) {
      expect(result.data.spot.thumbnail_url).toBeUndefined();
    }
  });
});
