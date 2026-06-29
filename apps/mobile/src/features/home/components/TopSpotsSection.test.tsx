import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));
vi.mock('expo-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock('../../../shared/data/spotRepository', () => ({
  spotKeys: {
    top: (n: number) => ['spots', 'top', n],
    topBoosted: (n: number) => ['spots', 'top-boosted', n],
  },
  getTopSpotsWithBoost: vi.fn(),
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
    isBoosted: false,
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
    isBoosted: false,
    nowScore: 80,
    bloomScore: 60,
  },
];

describe('TopSpotsSection', () => {
  it('데이터가 있으면 섹션 제목과 명소 카드를 렌더한다', () => {
    (useQuery as any).mockReturnValue({ data: mockSpots, isLoading: false });
    const { getByText, getByTestId } = render(<TopSpotsSection />);

    expect(getByText('꽃 명소 TOP 10')).toBeTruthy();
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

    expect(getByText('꽃 명소 TOP 10')).toBeTruthy();
    expect(getAllByTestId('top-spots-skeleton').length).toBeGreaterThan(0);
  });

  it('로딩 스켈레톤은 실제 카드와 동일한 width·borderRadius를 가진다(흰 여백 없는 풀카드)', () => {
    // 흰 배경 카드 래퍼 안에 작은 박스를 넣어 하단 흰 여백이 남던 회귀를 막는다(FR-4).
    (useQuery as any).mockReturnValue({ data: undefined, isLoading: true });
    const { getAllByTestId } = render(<TopSpotsSection />);

    const flat = StyleSheet.flatten(
      getAllByTestId('top-spots-skeleton')[0].props.style as never,
    ) as Record<string, unknown>;
    // 실제 카드: width 220, borderRadius 20
    expect(flat.width).toBe(220);
    expect(flat.borderRadius).toBe(20);
    // 이미지(120)만 한 작은 박스가 아니라 카드 전체 높이를 채운다
    expect(flat.height as number).toBeGreaterThanOrEqual(180);
  });

  it('데이터가 비어 있으면 "추천 집계 준비 중" 안내를 표시한다', () => {
    (useQuery as any).mockReturnValue({ data: [], isLoading: false });
    const { getByText, getByTestId } = render(<TopSpotsSection />);

    expect(getByTestId('top-spots-section')).toBeTruthy();
    expect(getByText('꽃 명소 TOP 10')).toBeTruthy();
    expect(getByText('추천 집계 준비 중')).toBeTruthy();
  });

  it('에러 상태에서는 "추천을 불러오지 못했어요" 안내를 표시한다', () => {
    (useQuery as any).mockReturnValue({
      data: [],
      isLoading: false,
      error: new Error('boom'),
    });
    const { getByText } = render(<TopSpotsSection />);

    expect(getByText('추천을 불러오지 못했어요')).toBeTruthy();
  });
});
