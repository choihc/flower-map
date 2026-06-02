import { describe, expect, it } from 'vitest';

import type { FlowerSpot, Stay } from '../../../shared/data/types';
import { findClosestSpot } from './findClosestSpot';

function makeStay(overrides: Partial<Stay> & { id: string; latitude: number; longitude: number }): Stay {
  return {
    id: overrides.id, slug: `slug-${overrides.id}`, name: `Stay ${overrides.id}`,
    regionPrimary: '서울', regionSecondary: '', address: '',
    latitude: overrides.latitude, longitude: overrides.longitude,
    stayType: 'city', seasonTags: [],
    seasonWindowStart: null, seasonWindowEnd: null,
    shortTagline: '', description: '', recommendationPoints: [],
    thumbnailUrl: null, bookingQueryOverride: null,
    tripcomBookingUrl: null,
    naverRating: null, googleRating: null, ratingCapturedAt: null,
    isFeatured: false, displayOrder: 0,
    ...overrides,
  };
}

function makeSpot(id: string, latitude: number, longitude: number, place = `Spot ${id}`): FlowerSpot {
  return {
    id, slug: `spot-${id}`, badge: '', bloomEndAt: '', bloomStartAt: '',
    bloomStatus: '', description: '', fee: '', festivalDate: '',
    flower: '벚꽃', flowerIsActive: true, flowerThumbnailUrl: null,
    helper: '', latitude, longitude, location: '', parking: '',
    place, thumbnailUrl: null, tone: 'pink',
  };
}

describe('findClosestSpot', () => {
  it('명소 후보 중 가장 가까운 spot과 거리(km)를 반환한다', () => {
    const stay = makeStay({ id: 'h1', latitude: 0, longitude: 0 });
    const spots = [
      makeSpot('a', 0.2, 0, '먼곳'),       // ~22km
      makeSpot('b', 0.05, 0, '가까운곳'),  // ~5.6km
      makeSpot('c', 0.5, 0, '아주먼곳'),   // ~55km
    ];

    const result = findClosestSpot(stay, spots);

    expect(result).not.toBeNull();
    expect(result!.spot.id).toBe('b');
    expect(result!.spot.place).toBe('가까운곳');
    expect(result!.distanceKm).toBeGreaterThan(5);
    expect(result!.distanceKm).toBeLessThan(7);
  });

  it('spots 배열이 비어있으면 null을 반환한다', () => {
    const stay = makeStay({ id: 'h1', latitude: 0, longitude: 0 });
    expect(findClosestSpot(stay, [])).toBeNull();
  });

  it('stay 좌표가 유효하지 않으면 null을 반환한다', () => {
    const stay = makeStay({ id: 'h1', latitude: Number.NaN, longitude: 0 });
    const spots = [makeSpot('a', 0, 0)];
    expect(findClosestSpot(stay, spots)).toBeNull();
  });

  it('좌표가 유효하지 않은 spot은 후보에서 제외된다', () => {
    const stay = makeStay({ id: 'h1', latitude: 0, longitude: 0 });
    const spots = [
      makeSpot('a', Number.NaN, 0, '결측'),
      makeSpot('b', 0.1, 0, '유효'),
    ];
    const result = findClosestSpot(stay, spots);
    expect(result?.spot.id).toBe('b');
  });

  it('모든 spot 좌표가 결측이면 null을 반환한다', () => {
    const stay = makeStay({ id: 'h1', latitude: 0, longitude: 0 });
    const spots = [makeSpot('a', Number.NaN, 0), makeSpot('b', 0, Number.NaN)];
    expect(findClosestSpot(stay, spots)).toBeNull();
  });
});
