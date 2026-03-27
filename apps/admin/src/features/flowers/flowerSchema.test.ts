import { describe, expect, it } from 'vitest';

import { flowerSchema } from './flowerSchema';

describe('flowerSchema', () => {
  it('accepts a valid flower payload', () => {
    const result = flowerSchema.safeParse({
      slug: 'cherry-blossom',
      name_ko: '벚꽃',
      name_en: null,
      color_hex: '#F6B7C1',
      season_start_month: 3,
      season_end_month: 4,
      sort_order: 1,
      is_active: true,
    });

    expect(result.success).toBe(true);
  });

  it('rejects a month outside 1 through 12', () => {
    const result = flowerSchema.safeParse({
      slug: 'cherry-blossom',
      name_ko: '벚꽃',
      color_hex: '#F6B7C1',
      season_start_month: 0,
      season_end_month: 4,
      sort_order: 1,
      is_active: true,
    });

    expect(result.success).toBe(false);
  });
});
