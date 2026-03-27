import { describe, expect, it } from 'vitest';

import { spotSchema } from './spotSchema';

describe('spotSchema', () => {
  it('accepts a draft spot with coordinates and bloom dates', () => {
    const result = spotSchema.safeParse({
      slug: 'yeouido-yunjung-ro',
      name: '여의도 윤중로',
      region_primary: '서울/경기',
      region_secondary: '서울 영등포구',
      address: '서울특별시 영등포구 여의서로 일대',
      latitude: 37.5259,
      longitude: 126.9226,
      description: '한강 바람을 따라 걷기 좋은 서울 대표 벚꽃 산책 코스',
      short_tip: '산책 동선이 좋고 축제 분위기가 살아 있는 대표 스팟',
      bloom_start_at: '2026-03-28',
      bloom_end_at: '2026-04-10',
      status: 'draft',
    });

    expect(result.success).toBe(true);
  });

  it('rejects an invalid status value', () => {
    const result = spotSchema.safeParse({
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
      status: 'archived',
    });

    expect(result.success).toBe(false);
  });
});
