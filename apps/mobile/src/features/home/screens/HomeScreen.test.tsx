import { describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import React from 'react';

import { HomeScreen } from './HomeScreen';

vi.mock('expo-router', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  Link: ({ children }: any) => children,
}));

vi.mock('../../../shared/data/spotRepository', () => ({
  getPublishedSpots: vi.fn().mockResolvedValue([]),
  getTopSpots: vi.fn().mockResolvedValue([]),
  spotKeys: {
    all: ['spots'],
    top: (n: number) => ['spots', 'top', n],
  },
  deriveFlowerLabels: vi.fn().mockReturnValue([]),
  deriveRegionSummaries: vi.fn().mockReturnValue(['서울', '제주']),
}));
vi.mock('../../../shared/data/stayRepository', () => ({
  getPublishedStays: vi.fn().mockResolvedValue([]),
  stayKeys: { all: ['stays'] },
}));
vi.mock('../../../shared/data/homeCurationRepository', () => ({
  getActiveHomeCurationSlots: vi.fn().mockResolvedValue([]),
  homeCurationKeys: { active: ['home-curation', 'active'] },
}));

function wrap(node: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{node}</QueryClientProvider>;
}

describe('HomeScreen', () => {
  it('헤더에 로고 이미지를 노출한다', async () => {
    const { getByTestId } = render(wrap(<HomeScreen />));
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
    expect(getByTestId('screen-shell-title-image')).toBeTruthy();
  });

  it('TopSpotsSection을 렌더한다', async () => {
    const { getByTestId } = render(wrap(<HomeScreen />));
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
    expect(getByTestId('top-spots-section')).toBeTruthy();
  });

  it('히어로/꽃 종류 칩/지금 보기 좋은 명소/위치 권한 버튼이 더 이상 렌더되지 않는다', async () => {
    const { queryByText } = render(wrap(<HomeScreen />));
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
    expect(queryByText('꽃 종류 선택')).toBeNull();
    expect(queryByText('지금 보기 좋은 명소')).toBeNull();
    expect(queryByText('📍 내 주변 명소 보기')).toBeNull();
    expect(queryByText('내 주변 명소')).toBeNull();
  });
});
