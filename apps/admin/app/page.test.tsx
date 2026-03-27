import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import HomePage from './page';
import { listFlowers } from '@/lib/data/flowers';
import { listSpots } from '@/lib/data/spots';
import { createServerSupabaseClient } from '@/lib/supabase/server';

vi.mock('@/lib/data/flowers', () => ({
  listFlowers: vi.fn(),
}));

vi.mock('@/lib/data/spots', () => ({
  listSpots: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
}));

describe('HomePage', () => {
  it('renders the admin dashboard landing page', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({} as never);
    vi.mocked(listFlowers).mockResolvedValue([
      {
        id: 'flower-1',
        slug: 'cherry-blossom',
        name_ko: '벚꽃',
        name_en: null,
        color_hex: '#F6B7C1',
        season_start_month: 3,
        season_end_month: 4,
        sort_order: 0,
        is_active: true,
        created_at: '2026-03-01T00:00:00.000Z',
        updated_at: '2026-03-01T00:00:00.000Z',
      },
    ]);
    vi.mocked(listSpots).mockResolvedValue([
      {
        id: 'spot-1',
        flower_id: 'flower-1',
        slug: 'oldest',
        name: '가장 오래된 곳',
        region_primary: '서울',
        region_secondary: '서울 서초구',
        address: '서울',
        latitude: 37,
        longitude: 127,
        description: '설명',
        short_tip: '팁',
        parking_info: null,
        admission_fee: null,
        festival_name: null,
        festival_start_at: null,
        festival_end_at: null,
        bloom_start_at: '2026-03-10',
        bloom_end_at: '2026-03-20',
        thumbnail_url: null,
        status: 'draft',
        source_type: 'manual_json',
        source_note: null,
        is_featured: false,
        display_order: 0,
        created_at: '2026-03-10T00:00:00.000Z',
        updated_at: '2026-03-10T00:00:00.000Z',
      },
      {
        id: 'spot-2',
        flower_id: 'flower-1',
        slug: 'newest',
        name: '가장 최근 곳',
        region_primary: '제주',
        region_secondary: '제주 서귀포시',
        address: '제주',
        latitude: 33,
        longitude: 126,
        description: '설명',
        short_tip: '팁',
        parking_info: null,
        admission_fee: null,
        festival_name: null,
        festival_start_at: null,
        festival_end_at: null,
        bloom_start_at: '2026-03-10',
        bloom_end_at: '2026-03-20',
        thumbnail_url: null,
        status: 'published',
        source_type: 'manual_json',
        source_note: null,
        is_featured: false,
        display_order: 0,
        created_at: '2026-03-12T00:00:00.000Z',
        updated_at: '2026-03-12T00:00:00.000Z',
      },
      {
        id: 'spot-3',
        flower_id: 'flower-1',
        slug: 'middle',
        name: '중간 곳',
        region_primary: '부산',
        region_secondary: '부산 해운대구',
        address: '부산',
        latitude: 35,
        longitude: 129,
        description: '설명',
        short_tip: '팁',
        parking_info: null,
        admission_fee: null,
        festival_name: null,
        festival_start_at: null,
        festival_end_at: null,
        bloom_start_at: '2026-03-10',
        bloom_end_at: '2026-03-20',
        thumbnail_url: null,
        status: 'draft',
        source_type: 'manual_json',
        source_note: null,
        is_featured: false,
        display_order: 0,
        created_at: '2026-03-11T00:00:00.000Z',
        updated_at: '2026-03-11T00:00:00.000Z',
      },
    ]);

    render(await HomePage());

    expect(screen.getByRole('heading', { name: '대시보드' })).toBeInTheDocument();
    expect(screen.getByText('현재 운영 상태와 검수 대기 항목을 한눈에 확인합니다.')).toBeInTheDocument();
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('가장 최근 곳');
    expect(screen.getAllByRole('row')[2]).toHaveTextContent('중간 곳');
    expect(screen.getAllByRole('row')[3]).toHaveTextContent('가장 오래된 곳');
  });
});
