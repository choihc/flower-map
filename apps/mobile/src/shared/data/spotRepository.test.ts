import { describe, expect, it, vi } from 'vitest';

const mockRow = {
  id: 'spot-1',
  slug: 'yeouido-yunjung-ro',
  name: '여의도 윤중로',
  flower: { name_ko: '벚꽃', thumbnail_url: 'https://blob.example.com/flower-cherry.jpg' },
  region_secondary: '서울 영등포구',
  description: '설명',
  short_tip: '팁',
  admission_fee: '무료',
  parking_info: null,
  festival_start_at: '2026-04-01',
  festival_end_at: '2026-04-07',
  bloom_start_at: '2026-03-28',
  bloom_end_at: '2026-04-10',
  is_featured: true,
  latitude: 37.5288,
  longitude: 126.9291,
  thumbnail_url: 'https://blob.example.com/cherry.jpg',
};

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: [mockRow], error: null }),
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: mockRow, error: null }),
          }),
        }),
      }),
    }),
  },
}));

import { getPublishedSpotBySlug, getPublishedSpots } from './spotRepository';

describe('spotRepository', () => {
  it('returns mapped FlowerSpot list from Supabase', async () => {
    const spots = await getPublishedSpots();

    expect(spots).toHaveLength(1);
    expect(spots[0]?.id).toBe('spot-1');
    expect(spots[0]?.slug).toBe('yeouido-yunjung-ro');
    expect(spots[0]?.place).toBe('여의도 윤중로');
    expect(spots[0]?.thumbnailUrl).toBe('https://blob.example.com/cherry.jpg');
    expect(spots[0]?.flowerThumbnailUrl).toBe('https://blob.example.com/flower-cherry.jpg');
  });

  it('returns a single spot by slug', async () => {
    const spot = await getPublishedSpotBySlug('yeouido-yunjung-ro');

    expect(spot?.place).toBe('여의도 윤중로');
  });
});
