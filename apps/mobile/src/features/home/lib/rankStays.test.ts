import { describe, expect, it } from 'vitest';

import type { FlowerSpot, Stay } from '../../../shared/data/types';
import { rankStaysForHome } from './rankStays';

function makeStay(overrides: Partial<Stay> & { id: string; latitude: number; longitude: number; regionPrimary?: string }): Stay {
  return {
    id: overrides.id,
    slug: `slug-${overrides.id}`,
    name: `Stay ${overrides.id}`,
    regionPrimary: overrides.regionPrimary ?? '서울',
    regionSecondary: '', address: '',
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

describe('rankStaysForHome', () => {
  it('꽃 TOP 10이 빈 배열이면 평점 단독으로 정렬한다 (proximityBoost = 0)', () => {
    const stays = [
      makeStay({ id: '1', latitude: 0, longitude: 0, naverRating: { score: 3, url: '' } }),
      makeStay({ id: '2', latitude: 0, longitude: 0, naverRating: { score: 5, url: '' } }),
      makeStay({ id: '3', latitude: 0, longitude: 0, naverRating: { score: 4, url: '' } }),
    ];
    const ranked = rankStaysForHome(stays, []);
    expect(ranked.map((r) => r.stay.id)).toEqual(['2', '3', '1']);
    expect(ranked[0].boostReason).toBeNull();
  });

  it('두 평점이 모두 있으면 평균을 사용한다 (최댓값 아님)', () => {
    const stays = [
      makeStay({ id: 'a', latitude: 0, longitude: 0,
        naverRating: { score: 5, url: '' }, googleRating: { score: 3, url: '' } }), // 평균 4.0
      makeStay({ id: 'b', latitude: 0, longitude: 0,
        naverRating: { score: 5, url: '' } }), // 5.0
    ];
    const ranked = rankStaysForHome(stays, []);
    expect(ranked[0].stay.id).toBe('b');
    expect(ranked[1].stay.id).toBe('a');
  });

  it('평점 동률 시 거리 가까운 쪽이 위로 온다', () => {
    const stays = [
      makeStay({ id: 'far',  latitude: 1.0, longitude: 0, naverRating: { score: 4, url: '' } }),
      makeStay({ id: 'near', latitude: 0.05, longitude: 0, naverRating: { score: 4, url: '' } }),
    ];
    const spots = [makeSpot('s1', 0, 0)];
    const ranked = rankStaysForHome(stays, spots);
    expect(ranked[0].stay.id).toBe('near');
  });

  it('거리 임계치 경계값(10/30/60km)을 폐구간으로 처리한다', () => {
    const spots = [makeSpot('origin', 0, 0)];
    const at10  = rankStaysForHome([makeStay({ id: 'a', latitude: 10  / 111.195, longitude: 0, naverRating: { score: 0, url: '' } })], spots);
    const at30  = rankStaysForHome([makeStay({ id: 'b', latitude: 30  / 111.195, longitude: 0, naverRating: { score: 0, url: '' } })], spots);
    const at60  = rankStaysForHome([makeStay({ id: 'c', latitude: 60  / 111.195, longitude: 0, naverRating: { score: 0, url: '' } })], spots);
    const at60p = rankStaysForHome([makeStay({ id: 'd', latitude: 60.5 / 111.195, longitude: 0, naverRating: { score: 0, url: '' } })], spots);
    expect(at10[0].score).toBeCloseTo(0.5 * 1.0, 5);
    expect(at30[0].score).toBeCloseTo(0.5 * 0.6, 5);
    expect(at60[0].score).toBeCloseTo(0.5 * 0.3, 5);
    expect(at60p[0].score).toBeCloseTo(0, 5);
  });

  it('같은 regionPrimary는 최대 2개까지만 채택한다', () => {
    const stays = [
      makeStay({ id: 's1', regionPrimary: '서울', latitude: 0, longitude: 0, naverRating: { score: 5, url: '' } }),
      makeStay({ id: 's2', regionPrimary: '서울', latitude: 0, longitude: 0, naverRating: { score: 4.9, url: '' } }),
      makeStay({ id: 's3', regionPrimary: '서울', latitude: 0, longitude: 0, naverRating: { score: 4.8, url: '' } }),
      makeStay({ id: 's4', regionPrimary: '서울', latitude: 0, longitude: 0, naverRating: { score: 4.7, url: '' } }),
      makeStay({ id: 'j1', regionPrimary: '제주', latitude: 0, longitude: 0, naverRating: { score: 4.6, url: '' } }),
      makeStay({ id: 'g1', regionPrimary: '강원', latitude: 0, longitude: 0, naverRating: { score: 4.5, url: '' } }),
    ];
    const ranked = rankStaysForHome(stays, []);
    expect(ranked.filter((r) => r.stay.regionPrimary === '서울').length).toBe(2);
    expect(ranked.map((r) => r.stay.id)).toEqual(['s1', 's2', 'j1', 'g1']);
  });

  it('후보 호캉스가 5개 미만이면 가능한 만큼만 반환한다', () => {
    const stays = [
      makeStay({ id: '1', latitude: 0, longitude: 0, naverRating: { score: 4, url: '' } }),
      makeStay({ id: '2', latitude: 0, longitude: 0, naverRating: { score: 3, url: '' } }),
    ];
    expect(rankStaysForHome(stays, [])).toHaveLength(2);
  });

  it('boostReason은 가장 가까운 꽃 명소 이름과 거리(km)를 가진다', () => {
    const stays = [makeStay({ id: 'h', latitude: 0.05, longitude: 0, naverRating: { score: 5, url: '' } })];
    const spots = [makeSpot('a', 0, 0, '장미공원'), makeSpot('b', 1, 0, '먼명소')];
    const ranked = rankStaysForHome(stays, spots);
    expect(ranked[0].boostReason?.spotName).toBe('장미공원');
    expect(ranked[0].boostReason!.distanceKm).toBeLessThan(10);
    expect(ranked[0].boostReason!.distanceKm).toBeGreaterThan(0);
  });

  it('거리 60km 초과면 boostReason은 null', () => {
    const stays = [makeStay({ id: 'far', latitude: 1.0, longitude: 0, naverRating: { score: 5, url: '' } })];
    const spots = [makeSpot('a', 0, 0, '장미공원')];
    expect(rankStaysForHome(stays, spots)[0].boostReason).toBeNull();
  });

  it('후보 풀이 poolSize로 제한되어 풀 밖 호캉스는 채택되지 않는다', () => {
    // 상위 5개 모두 '서울' → perRegionMax=2로 2개만 픽. '제주'는 점수 6위 → 풀(5) 밖 → 채택 불가.
    const stays = [
      makeStay({ id: 's1', regionPrimary: '서울', latitude: 0, longitude: 0, naverRating: { score: 5.0, url: '' } }),
      makeStay({ id: 's2', regionPrimary: '서울', latitude: 0, longitude: 0, naverRating: { score: 4.9, url: '' } }),
      makeStay({ id: 's3', regionPrimary: '서울', latitude: 0, longitude: 0, naverRating: { score: 4.8, url: '' } }),
      makeStay({ id: 's4', regionPrimary: '서울', latitude: 0, longitude: 0, naverRating: { score: 4.7, url: '' } }),
      makeStay({ id: 's5', regionPrimary: '서울', latitude: 0, longitude: 0, naverRating: { score: 4.6, url: '' } }),
      makeStay({ id: 'j1', regionPrimary: '제주', latitude: 0, longitude: 0, naverRating: { score: 4.5, url: '' } }),
    ];
    const ranked = rankStaysForHome(stays, [], { poolSize: 5 });
    expect(ranked.map((r) => r.stay.id)).toEqual(['s1', 's2']);
  });

  it('호캉스가 0건이면 빈 배열을 반환한다', () => {
    expect(rankStaysForHome([], [])).toEqual([]);
  });
});
