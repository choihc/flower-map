import type { FlowerSpot } from '../data/types';

export function resolveSpotImage(spot: FlowerSpot): { uri: string } | null {
  const url = spot.thumbnailUrl ?? spot.flowerThumbnailUrl;
  return url ? { uri: url } : null;
}
