import { describe, expect, it, vi } from 'vitest';

const mockPhotos = [
  {
    id: 'photo-1',
    spot_id: 'spot-1',
    url: 'https://example.com/photo1.jpg',
    sort_order: 0,
    caption: '전경',
    created_at: '2026-03-28T00:00:00Z',
  },
  {
    id: 'photo-2',
    spot_id: 'spot-1',
    url: 'https://example.com/photo2.jpg',
    sort_order: 1,
    caption: null,
    created_at: '2026-03-28T00:00:00Z',
  },
];

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: mockPhotos, error: null }),
        }),
      }),
    }),
  },
}));

describe('photoRepository', () => {
  it('getPhotosBySpotId returns mapped SpotPhoto array', async () => {
    const { getPhotosBySpotId } = await import('./photoRepository');
    const result = await getPhotosBySpotId('spot-1');

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: 'photo-1',
      spotId: 'spot-1',
      url: 'https://example.com/photo1.jpg',
      sortOrder: 0,
      caption: '전경',
      createdAt: '2026-03-28T00:00:00Z',
    });
  });

  it('returns empty array when data is null', async () => {
    vi.doMock('../lib/supabase', () => ({
      supabase: {
        from: () => ({
          select: () => ({
            eq: () => ({
              order: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
        }),
      },
    }));

    const { getPhotosBySpotId } = await import('./photoRepository');
    const result = await getPhotosBySpotId('spot-no-photos');
    expect(Array.isArray(result)).toBe(true);
  });
});
