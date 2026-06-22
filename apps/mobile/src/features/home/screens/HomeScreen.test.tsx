import { describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { HomeScreen } from './HomeScreen';

vi.mock('expo-router', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  Link: ({ children }: any) => children,
}));

vi.mock('../../../shared/data/spotRepository', () => ({
  getPublishedSpots: vi.fn(),
  getTopSpots: vi.fn(),
  spotKeys: {
    all: ['spots'],
    top: (n: number) => ['spots', 'top', n],
  },
  deriveFlowerLabels: vi.fn().mockReturnValue([]),
  deriveRegionSummaries: vi.fn().mockReturnValue(['서울', '제주']),
}));
vi.mock('../../../shared/data/stayRepository', () => ({
  getPublishedStays: vi.fn(),
  stayKeys: { all: ['stays'] },
}));
vi.mock('../../../shared/data/homeCurationRepository', () => ({
  getActiveHomeCurationSlots: vi.fn(),
  homeCurationKeys: { all: ['home-curation'], active: ['home-curation', 'active'] },
}));

import { getPublishedSpots, getTopSpots } from '../../../shared/data/spotRepository';
import { getPublishedStays } from '../../../shared/data/stayRepository';
import { getActiveHomeCurationSlots } from '../../../shared/data/homeCurationRepository';

/** 모든 홈 쿼리를 영원히 pending 상태로 둔다(캐시 미스 콜드 진입 모사). */
function mockAllPending() {
  vi.mocked(getPublishedSpots).mockReturnValue(new Promise(() => {}) as never);
  vi.mocked(getTopSpots).mockReturnValue(new Promise(() => {}) as never);
  vi.mocked(getPublishedStays).mockReturnValue(new Promise(() => {}) as never);
  vi.mocked(getActiveHomeCurationSlots).mockReturnValue(new Promise(() => {}) as never);
}

/** 모든 홈 쿼리를 빈 결과로 settle한다. */
function mockAllEmpty() {
  vi.mocked(getPublishedSpots).mockResolvedValue([]);
  vi.mocked(getTopSpots).mockResolvedValue([]);
  vi.mocked(getPublishedStays).mockResolvedValue([]);
  vi.mocked(getActiveHomeCurationSlots).mockResolvedValue([]);
}

function wrap(node: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{node}</QueryClientProvider>;
}

async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
  });
}

describe('HomeScreen', () => {
  it('모든 쿼리가 pending이어도 화면 셸 헤더는 즉시 노출된다 (FR-1)', () => {
    mockAllPending();
    const { getByTestId } = render(wrap(<HomeScreen />));
    expect(getByTestId('screen-shell-title-image')).toBeTruthy();
  });

  it('통합 대기 스켈레톤(home-skeleton)은 더 이상 존재하지 않는다 (FR-2)', () => {
    mockAllPending();
    const { queryByTestId } = render(wrap(<HomeScreen />));
    expect(queryByTestId('home-skeleton')).toBeNull();
  });

  it('spots가 pending이어도 큐레이션이 준비되면 독립적으로 노출된다 (FR-3)', async () => {
    // spots 의존(곧 끝나는 축제·지역 추천)·호캉스는 보류, 큐레이션만 success
    vi.mocked(getPublishedSpots).mockReturnValue(new Promise(() => {}) as never);
    vi.mocked(getTopSpots).mockReturnValue(new Promise(() => {}) as never);
    vi.mocked(getPublishedStays).mockReturnValue(new Promise(() => {}) as never);
    vi.mocked(getActiveHomeCurationSlots).mockResolvedValue([
      {
        id: 's1',
        slotKey: 'k',
        title: '큐레이션 타이틀',
        subtitle: null,
        ctaRoute: '/stays',
        ctaLabel: '보기 →',
        coverImageUrl: null,
        isActive: true,
        displayOrder: 0,
      },
    ]);
    const { getByTestId } = render(wrap(<HomeScreen />));
    await flush();
    // 큐레이션은 노출되고, spots 의존 섹션은 스켈레톤으로 공존(독립 렌더).
    expect(getByTestId('curation-section')).toBeTruthy();
    expect(getByTestId('ending-soon-skeleton')).toBeTruthy();
  });

  it('TopSpotsSection을 렌더한다', async () => {
    mockAllEmpty();
    const { getByTestId } = render(wrap(<HomeScreen />));
    await flush();
    expect(getByTestId('top-spots-section')).toBeTruthy();
  });

  it('히어로/꽃 종류 칩/지금 보기 좋은 명소/위치 권한 버튼이 렌더되지 않는다', async () => {
    mockAllEmpty();
    const { queryByText } = render(wrap(<HomeScreen />));
    await flush();
    expect(queryByText('꽃 종류 선택')).toBeNull();
    expect(queryByText('지금 보기 좋은 명소')).toBeNull();
    expect(queryByText('📍 내 주변 명소 보기')).toBeNull();
    expect(queryByText('내 주변 명소')).toBeNull();
  });
});
