import { describe, expect, it } from 'vitest';

import { toFlowerSpot } from './spotMappers';

describe('toFlowerSpot', () => {
  it('maps a published spot row into the existing mobile card shape', () => {
    const result = toFlowerSpot({
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
    });

    expect(result.place).toBe('여의도 윤중로');
    expect(result.flower).toBe('벚꽃');
    expect(result.badge).toBe('이번 주 절정');
    expect(result.festivalDate).toBe('2026.04.01 - 2026.04.07');
  });
});
