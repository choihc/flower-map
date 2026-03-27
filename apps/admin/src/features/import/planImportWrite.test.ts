import { describe, expect, it } from 'vitest';

import type { ImportPayload } from './importSchema';

import { planImportWrite } from './planImportWrite';

describe('planImportWrite', () => {
  it('splits rows into creates and updates and forces imported spots back to draft', () => {
    const payload: ImportPayload = {
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
        status: 'published',
      },
    };

    const result = planImportWrite(payload, {
      flowerId: 'flower-1',
      existingSpots: [{ id: 'spot-1', slug: 'yeouido-yunjung-ro' }],
    });

    expect(result.errors).toEqual([]);
    expect(result.toCreate).toEqual([]);
    expect(result.toUpdate).toEqual([
      {
        id: 'spot-1',
        input: expect.objectContaining({
          flower_id: 'flower-1',
          slug: 'yeouido-yunjung-ro',
          status: 'draft',
          source_type: 'manual_json',
        }),
      },
    ]);
  });

  it('reports duplicate slugs and skips all writes for duplicated rows', () => {
    const payload: ImportPayload = {
      flower: {
        slug: 'cherry-blossom',
        name_ko: '벚꽃',
        color_hex: '#F6B7C1',
        season_start_month: 3,
        season_end_month: 4,
        sort_order: 1,
        is_active: true,
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
        {
          slug: 'yeouido-yunjung-ro',
          name: '여의도 벚꽃길',
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
    };

    const result = planImportWrite(payload, {
      flowerId: 'flower-1',
      existingSpots: [],
    });

    expect(result.errors).toEqual(['yeouido-yunjung-ro slug is duplicated in the import payload']);
    expect(result.toCreate).toEqual([]);
    expect(result.toUpdate).toEqual([]);
  });
});
