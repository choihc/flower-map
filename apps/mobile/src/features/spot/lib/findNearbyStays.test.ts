import { describe, expect, it } from 'vitest';

import type { FlowerSpot, Stay } from '../../../shared/data/types';
import { findNearbyStays } from './findNearbyStays';

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

// 위도 1도 ≈ 111km. 좌표 거리 계산을 단순화하기 위해 위도만 조정.
// (0,0) 기준: lat 0.1 ≈ 11.1km, lat 0.27 ≈ 30km, lat 0.45 ≈ 50km, lat 0.55 ≈ 61km

describe('findNearbyStays', () => {
  const spot = makeSpot('s1', 0, 0, '학동흑진주몽돌해변');

  it('좌표 결측 호텔은 후보에서 제외된다', () => {
    const stays = [
      makeStay({ id: 'a', latitude: 0.05, longitude: 0 }),                  // ~5.6km, 유효
      makeStay({ id: 'b', latitude: Number.NaN, longitude: 0 }),            // 결측
      makeStay({ id: 'c', latitude: 200, longitude: 0 }),                   // 범위 초과
    ];
    const result = findNearbyStays(spot, stays);
    expect(result.stays.map((s) => s.stay.id)).toEqual(['a']);
    expect(result.usedFallback).toBe(false);
  });

  it('30km 이내 후보가 있으면 fallback이 발동되지 않는다', () => {
    const stays = [
      makeStay({ id: 'near1', latitude: 0.1, longitude: 0 }),   // ~11km
      makeStay({ id: 'far1',  latitude: 0.45, longitude: 0 }),  // ~50km (fallback 범위)
    ];
    const result = findNearbyStays(spot, stays);
    expect(result.usedFallback).toBe(false);
    expect(result.stays.every((s) => s.distanceKm <= 30)).toBe(true);
    expect(result.stays.map((s) => s.stay.id)).toEqual(['near1']);
  });

  it('30km 이내 0개 + 60km 이내 N개면 fallback이 발동된다', () => {
    const stays = [
      makeStay({ id: 'mid1', latitude: 0.35, longitude: 0 }),  // ~39km
      makeStay({ id: 'mid2', latitude: 0.45, longitude: 0 }),  // ~50km
    ];
    const result = findNearbyStays(spot, stays);
    expect(result.usedFallback).toBe(true);
    expect(result.stays).toHaveLength(2);
  });

  it('30km/60km 모두 0개면 stays:[] + usedFallback:false', () => {
    const stays = [
      makeStay({ id: 'too-far', latitude: 0.6, longitude: 0 }),  // ~67km
    ];
    const result = findNearbyStays(spot, stays);
    expect(result.stays).toEqual([]);
    expect(result.usedFallback).toBe(false);
  });

  it('limit=3 초과 후보가 있을 때 3개로 잘린다', () => {
    const stays = [
      makeStay({ id: 'a', latitude: 0.01, longitude: 0 }),
      makeStay({ id: 'b', latitude: 0.02, longitude: 0 }),
      makeStay({ id: 'c', latitude: 0.03, longitude: 0 }),
      makeStay({ id: 'd', latitude: 0.04, longitude: 0 }),
      makeStay({ id: 'e', latitude: 0.05, longitude: 0 }),
    ];
    const result = findNearbyStays(spot, stays);
    expect(result.stays).toHaveLength(3);
  });

  it('동일 score (평점 동일·거리 동일)일 때 안정적 정렬: distanceKm 오름차순', () => {
    // 거리만 미세 차이, 평점 모두 동일
    const stays = [
      makeStay({ id: 'closer', latitude: 0.01, longitude: 0,
        naverRating: { score: 4.0, url: '' } }),
      makeStay({ id: 'farther', latitude: 0.02, longitude: 0,
        naverRating: { score: 4.0, url: '' } }),
    ];
    const result = findNearbyStays(spot, stays);
    expect(result.stays.map((s) => s.stay.id)).toEqual(['closer', 'farther']);
  });

  it('평점이 더 높아도 거리 차이가 크면 가까운 쪽이 우선 (0.7 거리 가중)', () => {
    const stays = [
      makeStay({ id: 'closer-low', latitude: 0.01, longitude: 0,
        naverRating: { score: 3.0, url: '' } }),
      makeStay({ id: 'farther-high', latitude: 0.25, longitude: 0,
        naverRating: { score: 5.0, url: '' } }),
    ];
    const result = findNearbyStays(spot, stays);
    expect(result.stays[0].stay.id).toBe('closer-low');
  });

  it('options.limit / primaryRadiusKm / fallbackRadiusKm를 커스터마이즈할 수 있다', () => {
    const stays = [
      makeStay({ id: 'a', latitude: 0.1, longitude: 0 }),   // ~11km
      makeStay({ id: 'b', latitude: 0.15, longitude: 0 }),  // ~17km
    ];
    const result = findNearbyStays(spot, stays, { limit: 1, primaryRadiusKm: 5 });
    // 1차 5km 내에는 0개 → fallback 60km로 확장
    expect(result.usedFallback).toBe(true);
    expect(result.stays).toHaveLength(1);
  });

  it('반환된 각 NearbyStay에 distanceKm와 score가 포함된다', () => {
    const stays = [makeStay({ id: 'a', latitude: 0.05, longitude: 0 })];
    const result = findNearbyStays(spot, stays);
    expect(result.stays[0]).toEqual(
      expect.objectContaining({
        stay: expect.any(Object),
        distanceKm: expect.any(Number),
        score: expect.any(Number),
      }),
    );
  });
});
