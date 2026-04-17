import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react-native';

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));
vi.mock('expo-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock('../../../shared/data/spotRepository', () => ({
  spotKeys: { top: (n: number) => ['spots', 'top', n] },
  getTopSpots: vi.fn(),
}));

import { useQuery } from '@tanstack/react-query';
import { TopSpotsSection } from './TopSpotsSection';
import type { FlowerSpot } from '../../../shared/data/types';

const mockSpots: FlowerSpot[] = [
  {
    id: 't1',
    slug: 'top-1',
    place: 'TOP 1 명소',
    flower: '벚꽃',
    location: '서울 영등포구',
    helper: '도움말',
    description: '설명',
    bloomStatus: '개화 중',
    badge: '이번 주 절정',
    thumbnailUrl: null,
    flowerThumbnailUrl: null,
    tone: 'pink',
    bloomStartAt: '2026-03-28',
    bloomEndAt: '2026-04-10',
    fee: '무료',
    festivalDate: '',
    latitude: 37.5,
    longitude: 126.9,
    parking: '',
    flowerIsActive: true,
    nowScore: 90,
    bloomScore: 85,
    trendScore: 72,
  },
  {
    id: 't2',
    slug: 'top-2',
    place: 'TOP 2 명소',
    flower: '유채꽃',
    location: '제주 서귀포시',
    helper: '도움말2',
    description: '설명2',
    bloomStatus: '개화 중',
    badge: '지금 방문 추천',
    thumbnailUrl: null,
    flowerThumbnailUrl: null,
    tone: 'yellow',
    bloomStartAt: '2026-03-01',
    bloomEndAt: '2026-04-30',
    fee: '유료',
    festivalDate: '',
    latitude: 33.3,
    longitude: 126.5,
    parking: '',
    flowerIsActive: true,
    nowScore: 80,
    bloomScore: 60,
  },
];

describe('TopSpotsSection', () => {
  it('데이터가 있으면 섹션 제목과 명소 카드를 렌더한다', () => {
    (useQuery as any).mockReturnValue({ data: mockSpots, isLoading: false });
    const { getByText, getByTestId } = render(<TopSpotsSection />);

    expect(getByText('오늘의 TOP 10')).toBeTruthy();
    expect(getByText('TOP 1 명소')).toBeTruthy();
    expect(getByText('TOP 2 명소')).toBeTruthy();
    expect(getByTestId('top-spots-section')).toBeTruthy();
    // 첫 명소에는 bloom-peak와 trending 배지가 있어야 함
    expect(getByTestId('now-score-badge-bloom-peak')).toBeTruthy();
    expect(getByTestId('now-score-badge-trending')).toBeTruthy();
  });

  it('로딩 중에는 섹션 제목과 스켈레톤을 표시한다', () => {
    (useQuery as any).mockReturnValue({ data: undefined, isLoading: true });
    const { getByText, getAllByTestId } = render(<TopSpotsSection />);

    expect(getByText('오늘의 TOP 10')).toBeTruthy();
    expect(getAllByTestId('top-spots-skeleton').length).toBeGreaterThan(0);
  });

  it('데이터가 비어 있으면 섹션 자체를 렌더하지 않는다', () => {
    (useQuery as any).mockReturnValue({ data: [], isLoading: false });
    const { queryByTestId, queryByText } = render(<TopSpotsSection />);

    expect(queryByTestId('top-spots-section')).toBeNull();
    expect(queryByText('오늘의 TOP 10')).toBeNull();
  });
});
