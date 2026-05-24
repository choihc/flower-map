import type { FlowerSpot, Stay } from '../../../shared/data/types';
import { isValidCoordinate } from '../../../shared/lib/coordinate';
import { haversineKm } from '../../../shared/lib/location';

export type ClosestSpot = {
  spot: FlowerSpot;
  distanceKm: number;
};

export function findClosestSpot(stay: Stay, spots: FlowerSpot[]): ClosestSpot | null {
  if (!isValidCoordinate(stay.latitude, stay.longitude)) return null;

  let best: ClosestSpot | null = null;
  for (const spot of spots) {
    if (!isValidCoordinate(spot.latitude, spot.longitude)) continue;
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
