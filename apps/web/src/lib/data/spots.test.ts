import { describe, expect, it } from 'vitest';

import { buildSpotWriteInput } from './spots';

describe('buildSpotWriteInput', () => {
  it('normalizes empty strings to null and defaults status to draft', () => {
    const result = buildSpotWriteInput({
      flower_id: 'flower-1',
      slug: 'yeouido-yunjung-ro',
      name: '여의도 윤중로',
      region_primary: '서울/경기',
      region_secondary: '서울 영등포구',
      address: '서울특별시 영등포구 여의서로 일대',
      latitude: 37.5259,
      longitude: 126.9226,
      description: '설명',
      short_tip: '팁',
      parking_info: '',
      admission_fee: '',
      bloom_start_at: '2026-03-28',
      bloom_end_at: '2026-04-10',
    });

    expect(result.status).toBe('draft');
    expect(result.parking_info).toBeNull();
    expect(result.admission_fee).toBeNull();
  });
});
