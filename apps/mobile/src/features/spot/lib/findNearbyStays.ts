import type { FlowerSpot, Stay, StayRating } from '../../../shared/data/types';
import { isValidCoordinate } from '../../../shared/lib/coordinate';
import { haversineKm } from '../../../shared/lib/location';

export type NearbyStay = {
  stay: Stay;
  distanceKm: number;
  score: number;
};

export type NearbyStaysResult = {
  stays: NearbyStay[];
  usedFallback: boolean;
};

export type FindNearbyOptions = {
  limit?: number;
  primaryRadiusKm?: number;
  fallbackRadiusKm?: number;
};

const DEFAULTS = { limit: 3, primaryRadiusKm: 30, fallbackRadiusKm: 60 } as const;

function isValidRating(r: StayRating | null): r is StayRating {
  return r !== null && Number.isFinite(r.score);
}

function combineRating(stay: Stay): number | null {
  const candidates = [stay.naverRating, stay.googleRating].filter(isValidRating);
  if (candidates.length === 0) return null;
  return candidates.reduce((sum, r) => sum + r.score, 0) / candidates.length;
}

function normalizedRating(stay: Stay): number {
  const r = combineRating(stay);
  if (r === null) return 0;
  return Math.min(Math.max(r, 0), 5) / 5;
}

/**
 * 명소 좌표 기준으로 주변 호텔을 큐레이션한다.
 *
 * 처리 순서: (1) 좌표 결측 제외 → (2) 1차 반경 필터 → 0건이면 fallback 반경 필터 →
 * (3) 점수 계산 → (4) 정렬 → (5) limit 잘림.
 *
 * 점수식:
 *   score = 0.7 * (1 - distanceKm / fallbackRadiusKm) + 0.3 * normalizedRating
 *
 * 분모를 항상 fallbackRadiusKm로 고정하는 이유: 1차/2차 모두 동일 척도로 점수
 * 비교가 가능하다. 1차 반경 내 후보는 점수가 최소 (1 - primary/fallback) 이상이
 * 보장되어 fallback 후보보다 항상 높게 평가되는 구조 — 의도된 일관성.
 */
export function findNearbyStays(
  spot: FlowerSpot,
  stays: Stay[],
  options: FindNearbyOptions = {},
): NearbyStaysResult {
  const limit = options.limit ?? DEFAULTS.limit;
  const primaryRadiusKm = options.primaryRadiusKm ?? DEFAULTS.primaryRadiusKm;
  const fallbackRadiusKm = options.fallbackRadiusKm ?? DEFAULTS.fallbackRadiusKm;

  const validCoords = stays.filter((stay) =>
    isValidCoordinate(stay.latitude, stay.longitude),
  );

  const withDistance = validCoords.map((stay) => ({
    stay,
    distanceKm: haversineKm(
      { latitude: spot.latitude, longitude: spot.longitude },
      { latitude: stay.latitude, longitude: stay.longitude },
    ),
  }));

  function rank(candidates: Array<{ stay: Stay; distanceKm: number }>): NearbyStay[] {
    return candidates
      .map(({ stay, distanceKm }) => ({
        stay,
        distanceKm,
        score:
          0.7 * (1 - distanceKm / fallbackRadiusKm) +
          0.3 * normalizedRating(stay),
      }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.distanceKm - b.distanceKm;
      })
      .slice(0, limit);
  }

  const primaryCandidates = withDistance.filter((c) => c.distanceKm <= primaryRadiusKm);
  if (primaryCandidates.length > 0) {
    return { stays: rank(primaryCandidates), usedFallback: false };
  }

  const fallbackCandidates = withDistance.filter((c) => c.distanceKm <= fallbackRadiusKm);
  if (fallbackCandidates.length > 0) {
    return { stays: rank(fallbackCandidates), usedFallback: true };
  }

  return { stays: [], usedFallback: false };
}
