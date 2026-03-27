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
    vi.mocked(listFlowers).mockResolvedValue([]);
    vi.mocked(listSpots).mockResolvedValue([]);

    render(await HomePage());

    expect(screen.getByRole('heading', { name: '대시보드' })).toBeInTheDocument();
    expect(screen.getByText('현재 운영 상태와 검수 대기 항목을 한눈에 확인합니다.')).toBeInTheDocument();
  });
});
