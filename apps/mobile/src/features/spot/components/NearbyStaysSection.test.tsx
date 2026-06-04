import { act } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import type { FlowerSpot, Stay } from '../../../shared/data/types';
import { NearbyStaysSection } from './NearbyStaysSection';

// 코드베이스 표준 ESM mock 패턴 (HocanceTop5Section.test.tsx 참고).
vi.mock('../../../shared/data/stayRepository', () => ({
  getPublishedStays: vi.fn(),
  stayKeys: { all: ['stays'] },
}));
vi.mock('expo-router', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));
vi.mock('../../stays/lib/affiliateHotel', () => ({
  openTripcomHotel: vi.fn(),
}));

import { getPublishedStays } from '../../../shared/data/stayRepository';

function makeStay(o: Partial<Stay> & { id: string; latitude: number; longitude: number }): Stay {
  return {
    id: o.id, slug: `slug-${o.id}`, name: `Stay ${o.id}`,
    regionPrimary: '서울', regionSecondary: '강남', address: '',
    latitude: o.latitude, longitude: o.longitude,
    stayType: 'city', seasonTags: [],
    seasonWindowStart: null, seasonWindowEnd: null,
    shortTagline: '', description: '', recommendationPoints: [],
    thumbnailUrl: null, bookingQueryOverride: null,
    tripcomBookingUrl: null,
    naverRating: null, googleRating: null, ratingCapturedAt: null,
    isFeatured: false, displayOrder: 0,
    ...o,
  };
}

function makeSpot(): FlowerSpot {
  return {
    id: 'spot-1', slug: 'spot-1', badge: '', bloomEndAt: '', bloomStartAt: '',
    bloomStatus: '', description: '', fee: '', festivalDate: '',
    flower: '벚꽃', flowerIsActive: true, flowerThumbnailUrl: null,
    helper: '', latitude: 0, longitude: 0, location: '', parking: '',
    place: '학동흑진주몽돌해변', thumbnailUrl: null, tone: 'pink',
  };
}

function wrap(node: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{node}</QueryClientProvider>;
}

/** 비동기 쿼리 결과 반영까지 대기하는 헬퍼 (HocanceTop5Section.test.tsx 패턴) */
async function flushQueries() {
  await act(async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 50));
  });
}

describe('NearbyStaysSection', () => {
  it('주변 호텔이 0건이면 섹션 자체를 미렌더한다', async () => {
    vi.mocked(getPublishedStays).mockResolvedValue([]);
    const { queryByTestId } = render(wrap(<NearbyStaysSection spot={makeSpot()} />));
    await flushQueries();
    expect(queryByTestId('nearby-stays-section')).toBeNull();
  });

  it('1차 30km 후보가 있으면 헤더에 "30km 이내" 라벨이 노출된다', async () => {
    vi.mocked(getPublishedStays).mockResolvedValue([
      makeStay({ id: 'a', latitude: 0.1, longitude: 0 }), // ~11km
    ]);
    const { getByText } = render(wrap(<NearbyStaysSection spot={makeSpot()} />));
    await flushQueries();
    expect(getByText(/학동흑진주몽돌해변 30km 이내/)).toBeTruthy();
  });

  it('1차 0건 + 2차 N건이면 헤더에 "60km 이내" 라벨이 노출된다', async () => {
    vi.mocked(getPublishedStays).mockResolvedValue([
      makeStay({ id: 'mid', latitude: 0.4, longitude: 0 }), // ~44km
    ]);
    const { getByText } = render(wrap(<NearbyStaysSection spot={makeSpot()} />));
    await flushQueries();
    expect(getByText(/학동흑진주몽돌해변 60km 이내/)).toBeTruthy();
  });

  it('카드 부스트 라벨은 "이 명소에서 ..." 형식이다', async () => {
    vi.mocked(getPublishedStays).mockResolvedValue([
      makeStay({ id: 'a', latitude: 0.05, longitude: 0 }), // ~5.6km
    ]);
    const { getByText } = render(wrap(<NearbyStaysSection spot={makeSpot()} />));
    await flushQueries();
    expect(getByText(/이 명소에서 5\.6km/)).toBeTruthy();
  });

  it('후보가 limit(3) 미만이면 "더보기" 버튼이 미노출', async () => {
    vi.mocked(getPublishedStays).mockResolvedValue([
      makeStay({ id: 'a', latitude: 0.05, longitude: 0 }),
      makeStay({ id: 'b', latitude: 0.07, longitude: 0 }),
    ]);
    const { queryByTestId } = render(wrap(<NearbyStaysSection spot={makeSpot()} />));
    await flushQueries();
    expect(queryByTestId('nearby-stays-more')).toBeNull();
  });

  it('후보가 limit(3) 이상이면 "더보기" 버튼이 노출된다', async () => {
    vi.mocked(getPublishedStays).mockResolvedValue([
      makeStay({ id: 'a', latitude: 0.01, longitude: 0 }),
      makeStay({ id: 'b', latitude: 0.02, longitude: 0 }),
      makeStay({ id: 'c', latitude: 0.03, longitude: 0 }),
      makeStay({ id: 'd', latitude: 0.04, longitude: 0 }),
    ]);
    const { getByTestId } = render(wrap(<NearbyStaysSection spot={makeSpot()} />));
    await flushQueries();
    expect(getByTestId('nearby-stays-more')).toBeTruthy();
  });
});
