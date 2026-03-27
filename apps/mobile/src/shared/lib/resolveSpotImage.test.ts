import { describe, expect, it } from 'vitest';

import { resolveSpotImage } from './resolveSpotImage';
import type { FlowerSpot } from '../data/types';

const baseSpot: FlowerSpot = {
  id: 'spot-1',
  slug: 'test-slug',
  badge: '테스트',
  bloomStatus: '테스트',
  description: '설명',
  fee: '무료',
  festivalDate: '2026.04.01 - 2026.04.07',
  flower: '벚꽃',
  flowerThumbnailUrl: null,
  helper: '팁',
  latitude: 37.5,
  longitude: 126.9,
  location: '서울',
  parking: '정보 없음',
  place: '테스트 명소',
  thumbnailUrl: null,
  tone: 'pink',
};

describe('resolveSpotImage', () => {
  it('returns spot URL when thumbnailUrl is set', () => {
    const spot = { ...baseSpot, thumbnailUrl: 'https://blob.example.com/spot.jpg' };

    expect(resolveSpotImage(spot)).toEqual({ uri: 'https://blob.example.com/spot.jpg' });
  });

  it('returns flower URL when thumbnailUrl is null but flowerThumbnailUrl is set', () => {
    const spot = {
      ...baseSpot,
      thumbnailUrl: null,
      flowerThumbnailUrl: 'https://blob.example.com/flower.jpg',
    };

    expect(resolveSpotImage(spot)).toEqual({ uri: 'https://blob.example.com/flower.jpg' });
  });

  it('prefers spot URL over flower URL when both are set', () => {
    const spot = {
      ...baseSpot,
      thumbnailUrl: 'https://blob.example.com/spot.jpg',
      flowerThumbnailUrl: 'https://blob.example.com/flower.jpg',
    };

    expect(resolveSpotImage(spot)).toEqual({ uri: 'https://blob.example.com/spot.jpg' });
  });

  it('returns null when both thumbnailUrl and flowerThumbnailUrl are null', () => {
    expect(resolveSpotImage(baseSpot)).toBeNull();
  });
});
