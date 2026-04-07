import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import SpotDetailPage from './page';
import { getPublicSpotBySlug } from '@/lib/data/publicSpots';
import { createPublicServerSupabaseClient } from '@/lib/supabase/public-server';

const { notFound } = vi.hoisted(() => ({
  notFound: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  notFound,
}));

vi.mock('@/lib/data/publicSpots', () => ({
  getPublicSpotBySlug: vi.fn(),
}));

vi.mock('@/lib/supabase/public-server', () => ({
  createPublicServerSupabaseClient: vi.fn(),
}));

describe('SpotDetailPage', () => {
  it('renders public spot details by slug', async () => {
    vi.mocked(createPublicServerSupabaseClient).mockReturnValue({} as never);
    vi.mocked(getPublicSpotBySlug).mockResolvedValue({
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
    });

    render(await SpotDetailPage({ params: Promise.resolve({ slug: 'yeouido-yunjung-ro' }) }));

    expect(screen.getByRole('heading', { name: '여의도 윤중로' })).toBeInTheDocument();
    expect(screen.getByText(/평일 오전 추천/)).toBeInTheDocument();
    expect(screen.getByText('서울 영등포구 · 지금 보기 좋아요')).toBeInTheDocument();
    expect(screen.getByText('🌸 2026-03-28 ~ 2026-04-10')).toBeInTheDocument();
    expect(screen.getByText('입장료')).toBeInTheDocument();
    expect(screen.getByText('주차')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '길찾기' })).toHaveAttribute('href', expect.stringContaining('https://map.naver.com'));
    expect(screen.getByRole('button', { name: '저장하기' })).toBeDisabled();
  });

  it('calls notFound when the slug is missing', async () => {
    vi.mocked(createPublicServerSupabaseClient).mockReturnValue({} as never);
    vi.mocked(getPublicSpotBySlug).mockResolvedValue(null);

    await SpotDetailPage({ params: Promise.resolve({ slug: 'missing-spot' }) });

    expect(notFound).toHaveBeenCalled();
  });
});
