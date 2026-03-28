import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import SpotsPage from './page';
import { listFlowers } from '@/lib/data/flowers';
import { listSpots } from '@/lib/data/spots';
import { createServerSupabaseClient } from '@/lib/supabase/server';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock('@/lib/data/flowers', () => ({
  listFlowers: vi.fn(),
}));

vi.mock('@/lib/data/spots', () => ({
  listSpots: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
}));

vi.mock('@/features/spots/actions', () => ({
  bulkUpdateSpotStatusAction: vi.fn(),
}));

describe('SpotsPage', () => {
  it('renders KPIs, filter toolbar, and spot list table', async () => {
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
      {
        id: 'flower-2',
        slug: 'forsythia',
        name_ko: '개나리',
        name_en: null,
        color_hex: '#F4D03F',
        season_start_month: 3,
        season_end_month: 4,
        sort_order: 1,
        is_active: true,
        created_at: '2026-03-02T00:00:00.000Z',
        updated_at: '2026-03-02T00:00:00.000Z',
      },
    ]);
    vi.mocked(listSpots).mockResolvedValue([
      {
        id: 'spot-1',
        flower_id: 'flower-1',
        slug: 'cherry-road',
        name: '벚꽃길',
        region_primary: '서울/경기',
        region_secondary: '서울 영등포구',
        address: '서울',
        latitude: 37.5,
        longitude: 126.9,
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
        is_featured: true,
        display_order: 0,
        created_at: '2026-03-10T00:00:00.000Z',
        updated_at: '2026-03-10T00:00:00.000Z',
      },
      {
        id: 'spot-2',
        flower_id: 'flower-2',
        slug: 'forsythia-hill',
        name: '개나리 언덕',
        region_primary: '경상',
        region_secondary: '부산 해운대구',
        address: '부산',
        latitude: 35.2,
        longitude: 129.1,
        description: '설명',
        short_tip: '팁',
        parking_info: null,
        admission_fee: null,
        festival_name: '봄 축제',
        festival_start_at: '2026-03-15',
        festival_end_at: '2026-03-18',
        bloom_start_at: '2026-03-12',
        bloom_end_at: '2026-03-24',
        thumbnail_url: null,
        status: 'published',
        source_type: 'manual_json',
        source_note: null,
        is_featured: false,
        display_order: 1,
        created_at: '2026-03-11T00:00:00.000Z',
        updated_at: '2026-03-11T00:00:00.000Z',
      },
      {
        id: 'spot-3',
        flower_id: 'flower-2',
        slug: 'forsythia-ridge',
        name: '개나리 능선',
        region_primary: '제주',
        region_secondary: '제주 서귀포시',
        address: '제주',
        latitude: 33.2,
        longitude: 126.5,
        description: '설명',
        short_tip: '팁',
        parking_info: null,
        admission_fee: null,
        festival_name: null,
        festival_start_at: null,
        festival_end_at: null,
        bloom_start_at: '2026-03-13',
        bloom_end_at: '2026-03-25',
        thumbnail_url: null,
        status: 'published',
        source_type: 'manual_json',
        source_note: null,
        is_featured: true,
        display_order: 2,
        created_at: '2026-03-12T00:00:00.000Z',
        updated_at: '2026-03-12T00:00:00.000Z',
      },
    ]);

    render(await SpotsPage());

    // 페이지 제목
    expect(screen.getByRole('heading', { name: '명소 관리' })).toBeInTheDocument();

    // KPI 카드
    expect(screen.getByText('전체', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByText('검토 중', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByText('게시됨', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByText('대표', { selector: 'p' })).toBeInTheDocument();

    // 필터 바
    expect(screen.getByRole('textbox', { name: '검색' })).toBeInTheDocument();
    expect(screen.getByLabelText('상태')).toBeInTheDocument();
    expect(screen.getByLabelText('꽃')).toBeInTheDocument();

    // 테이블
    expect(screen.getByRole('heading', { name: '등록된 명소' })).toBeInTheDocument();
    const table = screen.getByRole('table');
    expect(within(table).getByText('벚꽃길')).toBeInTheDocument();
    expect(within(table).getByText('개나리 언덕')).toBeInTheDocument();
    expect(within(table).getByText('개나리 능선')).toBeInTheDocument();
    expect(within(table).getAllByText('대표', { selector: 'span' })).toHaveLength(2);

    // 새 명소 추가 버튼
    expect(screen.getByRole('link', { name: '새 명소 추가' })).toBeInTheDocument();
  });
});
