import { publishedSpotRows } from '../mocks/spots';
import type { FlowerSpot } from './types';
import { toFlowerSpot } from './spotMappers';

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function toRegionSummary(regionSecondary: string) {
  const primaryRegion = regionSecondary.split(' ')[0];

  if (primaryRegion === '서울' || primaryRegion === '경기') {
    return '서울/경기';
  }

  return primaryRegion;
}

export function getPublishedSpots(now = new Date()): FlowerSpot[] {
  return publishedSpotRows.map((row) => toFlowerSpot(row, now));
}

export function getPublishedSpotBySlug(slug: string, now = new Date()): FlowerSpot | undefined {
  const row = publishedSpotRows.find((item) => item.slug === slug);

  return row ? toFlowerSpot(row, now) : undefined;
}

export function getPublishedFlowerLabels(): string[] {
  return unique(publishedSpotRows.map((row) => row.flower.name_ko));
}

export function getPublishedRegionSummaries(): string[] {
  return unique(publishedSpotRows.map((row) => toRegionSummary(row.region_secondary)));
}
