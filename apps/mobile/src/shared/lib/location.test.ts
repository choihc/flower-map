import { describe, expect, it } from 'vitest';

import type { FlowerSpot } from '../data/types';
import { formatDistance, getNearbySpots } from './location';

// expo-location은 네이티브 모듈이므로 requestAndGetLocation은 단위 테스트 제외.
// 순수 함수(getNearbySpots, formatDistance)만 테스트한다.

const makeSpot = (id: string, lat: number, lng: number): FlowerSpot => ({
  id,
  slug: id,
  badge: '테스트',
  bloomEndAt: '2026-04-10',
  bloomStartAt: '2026-03-28',
  bloomStatus: '개화 중',
  description: '설명',
  fee: '무료',
  festivalDate: '2026.04.01 - 2026.04.07',
  flower: '벚꽃',
  flowerThumbnailUrl: null,
  helper: '팁',
  latitude: lat,
  longitude: lng,
  location: '서울',
  parking: '정보 없음',
  place: `명소 ${id}`,
  thumbnailUrl: null,
  tone: 'pink',
});

describe('getNearbySpots', () => {
  const userCoords = { latitude: 37.5, longitude: 126.9 };

  it('가까운 순으로 정렬한다', () => {
    const near = makeSpot('near', 37.501, 126.901);
    const far = makeSpot('far', 37.6, 127.0);
    const result = getNearbySpots([far, near], userCoords);
    expect(result[0].spot.id).toBe('near');
    expect(result[1].spot.id).toBe('far');
  });

  it('limit 개수만큼만 반환한다', () => {
    const spots = [
      makeSpot('a', 37.501, 126.901),
      makeSpot('b', 37.502, 126.902),
      makeSpot('c', 37.503, 126.903),
      makeSpot('d', 37.504, 126.904),
    ];
    expect(getNearbySpots(spots, userCoords, 2)).toHaveLength(2);
  });

  it('기본 limit은 3이다', () => {
    const spots = Array.from({ length: 5 }, (_, i) =>
      makeSpot(`s${i}`, 37.5 + i * 0.01, 126.9),
    );
    expect(getNearbySpots(spots, userCoords)).toHaveLength(3);
  });

  it('빈 배열이면 빈 배열을 반환한다', () => {
    expect(getNearbySpots([], userCoords)).toEqual([]);
  });

  it('distanceKm 값이 0보다 크다', () => {
    const spot = makeSpot('s', 37.6, 127.0);
    const result = getNearbySpots([spot], userCoords);
    expect(result[0].distanceKm).toBeGreaterThan(0);
  });

  it('알려진 좌표 간 거리를 근사치로 계산한다', () => {
    // 서울(37.5, 126.9) → 수원(37.27, 127.0) 직선거리 약 27km
    const suwon = makeSpot('suwon', 37.27, 127.0);
    const result = getNearbySpots([suwon], { latitude: 37.5, longitude: 126.9 }, 1);
    expect(result[0].distanceKm).toBeCloseTo(27, 0); // 27km ± 0.5km 허용
  });
});

describe('formatDistance', () => {
  it('1km 미만은 m 단위로 표시한다', () => {
    expect(formatDistance(0.5)).toBe('500m');
    expect(formatDistance(0.8)).toBe('800m');
  });

  it('정확히 1km이면 1km로 표시한다', () => {
    expect(formatDistance(1.0)).toBe('1km');
  });

  it('1km 이상 소수는 소수점 첫째 자리로 표시한다', () => {
    expect(formatDistance(1.25)).toBe('1.3km');
    expect(formatDistance(13.6)).toBe('13.6km');
  });

  it('반올림을 적용한다', () => {
    expect(formatDistance(0.9999)).toBe('1000m');
    expect(formatDistance(1.049)).toBe('1km');
    expect(formatDistance(1.051)).toBe('1.1km');
  });
});
