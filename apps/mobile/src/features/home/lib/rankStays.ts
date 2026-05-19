import type { FlowerSpot, Stay } from '../../../shared/data/types';
import { haversineKm } from '../../../shared/lib/location';

export type BoostReason = { spotName: string; distanceKm: number };

export type RankedStay = {
  stay: Stay;
  score: number;
  boostReason: BoostReason | null;
};

export type RankOptions = {
  limit?: number;        // 최종 반환 개수 (기본 5)
  perRegionMax?: number; // 같은 regionPrimary 최대 (기본 2)
  poolSize?: number;     // 점수 상위 풀 크기 (기본 15)
};

const DEFAULTS = { limit: 5, perRegionMax: 2, poolSize: 15 } as const;

function combineRating(stay: Stay): number | null {
  const naver = stay.naverRating && Number.isFinite(stay.naverRating.score) ? stay.naverRating.score : null;
  const google = stay.googleRating && Number.isFinite(stay.googleRating.score) ? stay.googleRating.score : null;
  if (naver !== null && google !== null) return (naver + google) / 2;
  if (naver !== null) return naver;
  if (google !== null) return google;
  return null;
}

function normalizedRating(stay: Stay): number {
  const r = combineRating(stay);
  if (r === null) return 0;
  return Math.min(Math.max(r, 0), 5) / 5;
}

function proximityBoostFromKm(distanceKm: number): number {
  if (distanceKm <= 10) return 1.0;
  if (distanceKm <= 30) return 0.6;
  if (distanceKm <= 60) return 0.3;
  return 0;
}

function nearestSpot(stay: Stay, spots: FlowerSpot[]): { spot: FlowerSpot; distanceKm: number } | null {
  if (spots.length === 0) return null;
  let best: { spot: FlowerSpot; distanceKm: number } | null = null;
  for (const spot of spots) {
    const distanceKm = haversineKm(
      { latitude: stay.latitude, longitude: stay.longitude },
      { latitude: spot.latitude, longitude: spot.longitude },
    );
    if (best === null || distanceKm < best.distanceKm) {
      best = { spot, distanceKm };
    }
  }
  return best;
}

export function rankStaysForHome(
  stays: Stay[],
  top10Spots: FlowerSpot[],
  options: RankOptions = {},
): RankedStay[] {
  const limit = options.limit ?? DEFAULTS.limit;
  const perRegionMax = options.perRegionMax ?? DEFAULTS.perRegionMax;
  const poolSize = options.poolSize ?? DEFAULTS.poolSize;

  if (stays.length === 0) return [];

  const scored: RankedStay[] = stays.map((stay) => {
    const nearest = nearestSpot(stay, top10Spots);
    const proximity = nearest ? proximityBoostFromKm(nearest.distanceKm) : 0;
    const score = 0.5 * normalizedRating(stay) + 0.5 * proximity;
    const boostReason: BoostReason | null =
      nearest && nearest.distanceKm <= 60
        ? { spotName: nearest.spot.place, distanceKm: nearest.distanceKm }
        : null;
    return { stay, score, boostReason };
  });

  scored.sort((a, b) => b.score - a.score);
  const pool = scored.slice(0, poolSize);

  const regionCount = new Map<string, number>();
  const picked: RankedStay[] = [];
  const overflow: RankedStay[] = [];
  for (const candidate of pool) {
    const region = candidate.stay.regionPrimary;
    const current = regionCount.get(region) ?? 0;
    if (current >= perRegionMax) {
      overflow.push(candidate);
      continue;
    }
    picked.push(candidate);
    regionCount.set(region, current + 1);
    if (picked.length >= limit) break;
  }

  // 전체 후보가 limit보다 적을 때는 다양성 제약을 완화하여 overflow로 채운다
  // (후보 부족 케이스: stays.length < limit)
  if (stays.length < limit && picked.length < limit) {
    for (const candidate of overflow) {
      picked.push(candidate);
      if (picked.length >= limit) break;
    }
  }

  return picked;
}
