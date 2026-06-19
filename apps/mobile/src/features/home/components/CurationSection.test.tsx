import { act } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react-native';
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
});
