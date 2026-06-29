import { act } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { RegionRecommendSection } from './RegionRecommendSection';

vi.mock('../../../shared/data/spotRepository', () => ({
  getPublishedSpots: vi.fn(),
  spotKeys: { all: ['spots'], top: (n: number) => ['spots', 'top', n] },
  deriveRegionSummaries: vi.fn(),
}));
const push = vi.fn();
vi.mock('expo-router', () => ({
  useRouter: () => ({ push }),
}));

import {
  deriveRegionSummaries,
  getPublishedSpots,
} from '../../../shared/data/spotRepository';

function wrap(node: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{node}</QueryClientProvider>;
}

async function flushQueries() {
  await act(async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 50));
  });
}

describe('RegionRecommendSection', () => {
  it('쿼리 pending이면 스켈레톤을 보여준다 (FR-4)', () => {
    vi.mocked(getPublishedSpots).mockReturnValue(new Promise(() => {}) as never);
    vi.mocked(deriveRegionSummaries).mockReturnValue([]);
    const { getByTestId } = render(wrap(<RegionRecommendSection />));
    expect(getByTestId('region-skeleton')).toBeTruthy();
  });

  it('로딩 스켈레톤은 지역 타일과 동일한 width·borderRadius를 가진다 (FR-4)', () => {
    // 실제 regionTile: width 48%, borderRadius 24
    vi.mocked(getPublishedSpots).mockReturnValue(new Promise(() => {}) as never);
    vi.mocked(deriveRegionSummaries).mockReturnValue([]);
    const { getAllByTestId } = render(wrap(<RegionRecommendSection />));
    const flat = StyleSheet.flatten(
      getAllByTestId('region-skeleton-box')[0].props.style as never,
    ) as Record<string, unknown>;
    expect(flat.width).toBe('48%');
    expect(flat.borderRadius).toBe(24);
  });

  it('지역 요약이 있으면 헤더와 타일을 렌더한다', async () => {
    vi.mocked(getPublishedSpots).mockResolvedValue([]);
    vi.mocked(deriveRegionSummaries).mockReturnValue(['서울', '제주']);
    const { getByText, queryByTestId } = render(wrap(<RegionRecommendSection />));
    await flushQueries();
    expect(queryByTestId('region-skeleton')).toBeNull();
    expect(getByText('지역별 추천')).toBeTruthy();
    expect(getByText('서울')).toBeTruthy();
    expect(getByText('제주')).toBeTruthy();
  });

  it('지역 요약이 0개면 섹션을 숨긴다 (FR-5)', async () => {
    vi.mocked(getPublishedSpots).mockResolvedValue([]);
    vi.mocked(deriveRegionSummaries).mockReturnValue([]);
    const { queryByText } = render(wrap(<RegionRecommendSection />));
    await flushQueries();
    expect(queryByText('지역별 추천')).toBeNull();
  });

  it('타일을 누르면 검색 탭으로 지역 쿼리를 전달한다', async () => {
    push.mockClear();
    vi.mocked(getPublishedSpots).mockResolvedValue([]);
    vi.mocked(deriveRegionSummaries).mockReturnValue(['서울']);
    const { getByText } = render(wrap(<RegionRecommendSection />));
    await flushQueries();
    fireEvent.press(getByText('서울'));
    expect(push).toHaveBeenCalledWith({
      pathname: '/(tabs)/search',
      params: { query: '서울' },
    });
  });

  it('쿼리 에러면 섹션을 숨기고 console.error로 관측 가능하다 (FR-6)', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(getPublishedSpots).mockRejectedValue(new Error('boom'));
    vi.mocked(deriveRegionSummaries).mockReturnValue([]);
    const { queryByText } = render(wrap(<RegionRecommendSection />));
    await flushQueries();
    expect(queryByText('지역별 추천')).toBeNull();
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[RegionRecommendSection]'),
      expect.anything(),
    );
    errorSpy.mockRestore();
  });

  it('백그라운드 리패치가 실패해도 캐시 데이터가 있으면 계속 렌더한다 (FR-8 SWR)', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(deriveRegionSummaries).mockReturnValue(['서울']);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(['spots'], [{ id: 'x' }]); // 복원된 캐시 모사(deriveRegionSummaries는 mock)
    vi.mocked(getPublishedSpots).mockRejectedValue(new Error('refetch fail'));
    await client.refetchQueries({ queryKey: ['spots'] });
    const { getByText } = render(
      <QueryClientProvider client={client}>
        <RegionRecommendSection />
      </QueryClientProvider>,
    );
    expect(getByText('서울')).toBeTruthy();
    errorSpy.mockRestore();
  });
});
