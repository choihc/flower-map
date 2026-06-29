import { act } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import type { HomeCurationSlot } from '../../../shared/data/types';
import { CurationSection } from './CurationSection';

vi.mock('../../../shared/data/homeCurationRepository', () => ({
  getActiveHomeCurationSlots: vi.fn(),
  homeCurationKeys: { all: ['homeCuration'], active: ['homeCuration', 'active'] },
}));
vi.mock('expo-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import { getActiveHomeCurationSlots } from '../../../shared/data/homeCurationRepository';

const validSlot: HomeCurationSlot = {
  id: 'slot-1',
  slotKey: 'hocance-weekend',
  title: '이번 주말, 호캉스 어디 갈까?',
  subtitle: '도심 속 휴식 10곳',
  ctaRoute: '/stays',
  ctaLabel: '호캉스 보기 →',
  coverImageUrl: null,
  isActive: true,
  displayOrder: 0,
};

function wrap(node: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{node}</QueryClientProvider>;
}

async function flushQueries() {
  await act(async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 50));
  });
}

describe('CurationSection', () => {
  it('쿼리 pending이면 스켈레톤을 보여준다 (FR-4)', () => {
    vi.mocked(getActiveHomeCurationSlots).mockReturnValue(new Promise(() => {}) as never);
    const { getByTestId } = render(wrap(<CurationSection />));
    expect(getByTestId('curation-skeleton')).toBeTruthy();
  });

  it('로딩 스켈레톤은 큐레이션 카드와 동일한 height·borderRadius를 가진다 (FR-4)', () => {
    // 실제 SeasonCurationSlot: height 220, borderRadius 28
    vi.mocked(getActiveHomeCurationSlots).mockReturnValue(new Promise(() => {}) as never);
    const { getByTestId } = render(wrap(<CurationSection />));
    const flat = StyleSheet.flatten(
      getByTestId('curation-skeleton-box').props.style as never,
    ) as Record<string, unknown>;
    expect(flat.height).toBe(220);
    expect(flat.borderRadius).toBe(28);
  });

  it('유효 슬롯이 없으면 섹션을 숨긴다 (FR-5)', async () => {
    vi.mocked(getActiveHomeCurationSlots).mockResolvedValue([]);
    const { queryByTestId } = render(wrap(<CurationSection />));
    await flushQueries();
    expect(queryByTestId('curation-skeleton')).toBeNull();
    expect(queryByTestId('curation-section')).toBeNull();
  });

  it('유효 슬롯이 있으면 SeasonCurationSlot을 렌더한다', async () => {
    vi.mocked(getActiveHomeCurationSlots).mockResolvedValue([validSlot]);
    const { getByTestId, getByText } = render(wrap(<CurationSection />));
    await flushQueries();
    expect(getByTestId('curation-section')).toBeTruthy();
    expect(getByText('이번 주말, 호캉스 어디 갈까?')).toBeTruthy();
  });

  it('제목/CTA 라벨이 빈 슬롯은 필터링되어 숨겨진다 (FR-5)', async () => {
    vi.mocked(getActiveHomeCurationSlots).mockResolvedValue([
      { ...validSlot, title: '   ', ctaLabel: '' },
    ]);
    const { queryByTestId } = render(wrap(<CurationSection />));
    await flushQueries();
    expect(queryByTestId('curation-section')).toBeNull();
  });

  it('쿼리 에러면 섹션을 숨기고 console.error로 관측 가능하다 (FR-6)', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(getActiveHomeCurationSlots).mockRejectedValue(new Error('boom'));
    const { queryByTestId } = render(wrap(<CurationSection />));
    await flushQueries();
    expect(queryByTestId('curation-section')).toBeNull();
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[CurationSection]'),
      expect.anything(),
    );
    errorSpy.mockRestore();
  });

  it('백그라운드 리패치가 실패해도 캐시 데이터가 있으면 계속 렌더한다 (FR-8 SWR)', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(['homeCuration', 'active'], [validSlot]); // 복원된 캐시 모사
    vi.mocked(getActiveHomeCurationSlots).mockRejectedValue(new Error('refetch fail'));
    // 리패치를 먼저 실패시켜 status='error' + data 유지 상태를 결정적으로 만든다.
    await client.refetchQueries({ queryKey: ['homeCuration', 'active'] });
    const { getByText, getByTestId } = render(
      <QueryClientProvider client={client}>
        <CurationSection />
      </QueryClientProvider>,
    );
    expect(getByTestId('curation-section')).toBeTruthy();
    expect(getByText('이번 주말, 호캉스 어디 갈까?')).toBeTruthy();
    errorSpy.mockRestore();
  });
});
