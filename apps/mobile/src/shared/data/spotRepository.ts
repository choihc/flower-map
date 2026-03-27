import {
  featuredSpots,
  flowerLabels,
  regionSummaries,
} from '../mocks/spots';
import type { FlowerSpot } from './types';

export function getPublishedSpots(): FlowerSpot[] {
  return featuredSpots;
}

export function getPublishedSpotById(spotId: string): FlowerSpot | undefined {
  return featuredSpots.find((spot) => spot.id === spotId);
}

export function getPublishedFlowerLabels(): string[] {
  return flowerLabels;
}

export function getPublishedRegionSummaries(): string[] {
  return regionSummaries;
}
