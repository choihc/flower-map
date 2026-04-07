import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import FlowersPage from './page';
import { listFlowers } from '@/lib/data/flowers';
import { createServerSupabaseClient } from '@/lib/supabase/server';

vi.mock('@/lib/data/flowers', () => ({
  createFlower: vi.fn(),
  listFlowers: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
}));

describe('FlowersPage', () => {
  it('renders the management workspace with the flower form sections and list', async () => {
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
        sort_order: 1,
        is_active: true,
        created_at: '2026-03-01T00:00:00.000Z',
        updated_at: '2026-03-02T00:00:00.000Z',
      },
      {
        id: 'flower-2',
        slug: 'forsythia',
        name_ko: '개나리',
        name_en: null,
        color_hex: '#F4D03F',
        season_start_month: 3,
        season_end_month: 4,
        sort_order: 2,
        is_active: false,
        created_at: '2026-03-03T00:00:00.000Z',
        updated_at: '2026-03-04T00:00:00.000Z',
      },
    ]);

    render(await FlowersPage());

    expect(screen.getByRole('heading', { name: '꽃 관리' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '등록된 꽃' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '꽃 정보 입력' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '기본 정보' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '시즌 정보' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '표시 설정' })).toBeInTheDocument();
    expect(screen.getByText('벚꽃')).toBeInTheDocument();
    expect(screen.getByText('개나리')).toBeInTheDocument();
  });
});
