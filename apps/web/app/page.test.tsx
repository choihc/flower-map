import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import HomePage from './(public)/page';
import { listPublicSpots } from '@/lib/data/publicSpots';
import { createPublicServerSupabaseClient } from '@/lib/supabase/public-server';

vi.mock('@/lib/data/publicSpots', () => ({
  listPublicSpots: vi.fn(),
}));

vi.mock('@/lib/supabase/public-server', () => ({
  createPublicServerSupabaseClient: vi.fn(),
}));

describe('HomePage', () => {
  it('renders the public landing page at root', async () => {
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

    render(await HomePage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole('heading', { name: '지금 보기 좋은 명소', level: 1 })).toBeInTheDocument();
    expect(screen.getAllByRole('link').some((link) => link.getAttribute('href') === '/spot/yeouido-yunjung-ro')).toBe(true);
    expect(screen.getByRole('link', { name: '전체' })).toHaveAttribute('href', '/');
    expect(screen.getByTestId('hero-carousel-track')).toHaveClass('scrollbar-hidden');
  });
});
