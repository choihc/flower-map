import { act } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import type { FlowerSpot } from '../../../shared/data/types';
import { EndingSoonSection } from './EndingSoonSection';

vi.mock('../../../shared/data/spotRepository', () => ({
  getPublishedSpots: vi.fn(),
  spotKeys: { all: ['spots'], top: (n: number) => ['spots', 'top', n] },
}));
const push = vi.fn();
vi.mock('expo-router', () => ({
  useRouter: () => ({ push }),
}));

import { getPublishedSpots } from '../../../shared/data/spotRepository';

function makeSpot(over: Partial<FlowerSpot> & { id: string }): FlowerSpot {
  return {
    slug: `sp-${over.id}`,
    badge: '',
    bloomEndAt: '',
    bloomStartAt: '',
    bloomStatus: '',
    description: '',
    fee: '',
    festivalDate: '5월 1일 ~ 5월 10일',
    flower: '벚꽃',
    flowerIsActive: true,
    flowerThumbnailUrl: null,
    helper: '도움말',
    isBoosted: false,
    latitude: 0,
    longitude: 0,
    location: '서울',
    parking: '',
    place: `명소 ${over.id}`,
    thumbnailUrl: null,
    tone: 'pink',
    ...over,
  };
}

function wrap(node: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{node}</QueryClientProvider>;
}

async function flushQueries() {
  await act(async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 50));
  });
}

describe('EndingSoonSection', () => {
  it('쿼리 pending이면 스켈레톤을 보여준다 (FR-4)', () => {
    vi.mocked(getPublishedSpots).mockReturnValue(new Promise(() => {}) as never);
    const { getByTestId } = render(wrap(<EndingSoonSection />));
    expect(getByTestId('ending-soon-skeleton')).toBeTruthy();
  });

  it('로딩 스켈레톤은 이벤트 카드 전체 높이를 채우고 동일한 borderRadius를 가진다 (FR-4)', () => {
    // 실제 eventCard: 이미지(180) + 본문 영역 → 이미지만 한 작은 박스가 아니라 카드 전체를 대표한다.
    vi.mocked(getPublishedSpots).mockReturnValue(new Promise(() => {}) as never);
    const { getByTestId } = render(wrap(<EndingSoonSection />));
    const flat = StyleSheet.flatten(
      getByTestId('ending-soon-skeleton-box').props.style as never,
    ) as Record<string, unknown>;
    expect(flat.borderRadius).toBe(30);
    expect(flat.height as number).toBeGreaterThanOrEqual(280);
  });

  it('명소가 없으면 섹션을 숨긴다 (FR-5)', async () => {
    vi.mocked(getPublishedSpots).mockResolvedValue([]);
    const { queryByTestId, queryByText } = render(wrap(<EndingSoonSection />));
    await flushQueries();
    expect(queryByTestId('ending-soon-skeleton')).toBeNull();
    expect(queryByText('곧 끝나는 축제')).toBeNull();
  });

  it('eventEndsIn이 가장 임박한 명소를 헤더·메타와 함께 노출한다', async () => {
    vi.mocked(getPublishedSpots).mockResolvedValue([
      makeSpot({ id: 'a', place: '늦게 끝나는 곳', eventEndsIn: 'D-5' }),
      makeSpot({ id: 'b', place: '곧 끝나는 곳', eventEndsIn: 'D-2' }),
    ]);
    const { getByText } = render(wrap(<EndingSoonSection />));
    await flushQueries();
    expect(getByText('곧 끝나는 축제')).toBeTruthy();
    expect(getByText('종료된 일정은 제외해 보여드려요')).toBeTruthy();
    expect(getByText('곧 끝나는 곳')).toBeTruthy();
  });

  it('카드를 누르면 해당 명소 상세로 이동한다', async () => {
    push.mockClear();
    vi.mocked(getPublishedSpots).mockResolvedValue([
      makeSpot({ id: 'b', place: '곧 끝나는 곳', eventEndsIn: 'D-2' }),
    ]);
    const { getByText } = render(wrap(<EndingSoonSection />));
    await flushQueries();
    const { fireEvent } = await import('@testing-library/react-native');
    fireEvent.press(getByText('행사 자세히 보기'));
    expect(push).toHaveBeenCalledWith('/spot/sp-b');
  });

  it('쿼리 에러면 섹션을 숨기고 console.error로 관측 가능하다 (FR-6)', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(getPublishedSpots).mockRejectedValue(new Error('boom'));
    const { queryByText } = render(wrap(<EndingSoonSection />));
    await flushQueries();
    expect(queryByText('곧 끝나는 축제')).toBeNull();
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[EndingSoonSection]'),
      expect.anything(),
    );
    errorSpy.mockRestore();
  });

  it('백그라운드 리패치가 실패해도 캐시 데이터가 있으면 계속 렌더한다 (FR-8 SWR)', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(['spots'], [makeSpot({ id: 'b', place: '곧 끝나는 곳', eventEndsIn: 'D-2' })]);
    vi.mocked(getPublishedSpots).mockRejectedValue(new Error('refetch fail'));
    await client.refetchQueries({ queryKey: ['spots'] });
    const { getByText } = render(
      <QueryClientProvider client={client}>
        <EndingSoonSection />
      </QueryClientProvider>,
    );
    expect(getByText('곧 끝나는 곳')).toBeTruthy();
    errorSpy.mockRestore();
  });
});
