import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import SearchPage from './page';
import { listPublicSpots } from '@/lib/data/publicSpots';
import { createPublicServerSupabaseClient } from '@/lib/supabase/public-server';

vi.mock('@/lib/data/publicSpots', () => ({
  listPublicSpots: vi.fn(),
}));

vi.mock('@/lib/supabase/public-server', () => ({
  createPublicServerSupabaseClient: vi.fn(),
}));

describe('SearchPage', () => {
  it('renders public search results', async () => {
    vi.mocked(createPublicServerSupabaseClient).mockReturnValue({} as never);
    vi.mocked(listPublicSpots).mockResolvedValue([
      {
        id: 'spot-1',
        slug: 'yeouido-yunjung-ro',
        place: '여의도 윤중로',
        flower: '벚꽃',
        location: '서울 영등포구',
        description: '벚꽃 산책 명소',
        helper: '평일 오전 추천',
        festivalDate: '일정 미정',
        bloomStartAt: '2026-03-28',
        bloomEndAt: '2026-04-10',
        thumbnailUrl: null,
        flowerThumbnailUrl: null,
        latitude: 37.5259,
        longitude: 126.9226,
        isFeatured: true,
      },
    ]);

    render(await SearchPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole('heading', { name: '검색' })).toBeInTheDocument();
    expect(screen.getByText('여의도 윤중로')).toBeInTheDocument();
    expect(screen.getByText('벚꽃')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('명소 이름, 지역으로 검색')).toBeInTheDocument();
  });
});
