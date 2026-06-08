import { act } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import type { FlowerSpot, Stay } from '../../../shared/data/types';
import { HocanceTop5Section } from './HocanceTop5Section';

vi.mock('../../../shared/data/stayRepository', () => ({
  getPublishedStays: vi.fn(),
  stayKeys: { all: ['stays'] },
}));
vi.mock('../../../shared/data/spotRepository', () => ({
  getTopSpots: vi.fn(),
  spotKeys: {
    all: ['spots'],
    top: (n: number) => ['spots', 'top', n],
  },
}));
vi.mock('expo-router', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));
vi.mock('../../stays/lib/affiliateHotel', () => ({
  openTripcomHotel: vi.fn(),
  openAgodaHotel: vi.fn(),
}));

import { getPublishedStays } from '../../../shared/data/stayRepository';
import { getTopSpots } from '../../../shared/data/spotRepository';

function makeStay(over: Partial<Stay> & { id: string; latitude?: number; longitude?: number; regionPrimary?: string }): Stay {
  const base: Stay = {
    id: over.id, slug: `s-${over.id}`, name: `Stay ${over.id}`,
    regionPrimary: over.regionPrimary ?? '서울', regionSecondary: '', address: '',
    latitude: over.latitude ?? 0, longitude: over.longitude ?? 0,
    stayType: 'city', seasonTags: [],
    seasonWindowStart: null, seasonWindowEnd: null, shortTagline: '',
    description: '', recommendationPoints: [], thumbnailUrl: null,
    tripcomBookingUrl: null, agodaHotelId: null, bookingQueryOverride: null, naverRating: { score: 4.5, url: '' },
    googleRating: null, ratingCapturedAt: null, isFeatured: false, displayOrder: 0,
  };
  return { ...base, ...over };
}

function makeSpot(id: string, latitude = 0, longitude = 0, place = `Spot ${id}`): FlowerSpot {
  return {
    id, slug: `sp-${id}`, badge: '', bloomEndAt: '', bloomStartAt: '',
    bloomStatus: '', description: '', fee: '', festivalDate: '',
    flower: '벚꽃', flowerIsActive: true, flowerThumbnailUrl: null,
    helper: '', latitude, longitude, location: '', parking: '',
    place, thumbnailUrl: null, tone: 'pink',
  };
}

function wrap(node: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{node}</QueryClientProvider>;
}

/** 비동기 쿼리 결과 반영까지 대기하는 헬퍼 */
async function flushQueries() {
  await act(async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 50));
  });
}

describe('HocanceTop5Section', () => {
  it('호캉스 0건이면 섹션 자체를 미렌더한다', async () => {
    vi.mocked(getPublishedStays).mockResolvedValue([]);
    vi.mocked(getTopSpots).mockResolvedValue([]);
    const { queryByTestId } = render(wrap(<HocanceTop5Section />));
    await flushQueries();
    expect(queryByTestId('hocance-top5-section')).toBeNull();
  });

  it('호캉스가 있으면 섹션 헤더와 카드를 렌더한다', async () => {
    vi.mocked(getPublishedStays).mockResolvedValue([
      makeStay({ id: '1', latitude: 0.05, longitude: 0 }),
      makeStay({ id: '2', regionPrimary: '제주', latitude: 0.05, longitude: 0 }),
    ]);
    vi.mocked(getTopSpots).mockResolvedValue([makeSpot('s1', 0, 0, '장미공원')]);
    const { getByTestId, getByText, getAllByTestId } = render(wrap(<HocanceTop5Section />));
    await flushQueries();
    expect(getByTestId('hocance-top5-section')).toBeTruthy();
    expect(getByText('꽃 명소 주변 호텔보기')).toBeTruthy();
    expect(getAllByTestId('stay-card').length).toBeGreaterThan(0);
  });

  it('꽃 TOP 10 근처(≤60km)면 부스트 칩이 노출된다', async () => {
    vi.mocked(getPublishedStays).mockResolvedValue([
      makeStay({ id: '1', latitude: 0.05, longitude: 0 }),
    ]);
    vi.mocked(getTopSpots).mockResolvedValue([makeSpot('s1', 0, 0, '장미공원')]);
    const { getByTestId } = render(wrap(<HocanceTop5Section />));
    await flushQueries();
    expect(getByTestId('stay-card-boost-badge')).toBeTruthy();
  });

  it('꽃 TOP 10과 거리 > 60km면 부스트 칩을 렌더하지 않는다', async () => {
    vi.mocked(getPublishedStays).mockResolvedValue([
      makeStay({ id: '1', latitude: 1.0, longitude: 0 }), // ~111km
    ]);
    vi.mocked(getTopSpots).mockResolvedValue([makeSpot('s1', 0, 0, '장미공원')]);
    const { getByTestId, queryByTestId } = render(wrap(<HocanceTop5Section />));
    await flushQueries();
    expect(getByTestId('hocance-top5-section')).toBeTruthy();
    expect(queryByTestId('stay-card-boost-badge')).toBeNull();
  });
});
