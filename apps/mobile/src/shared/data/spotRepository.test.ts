import { describe, expect, it } from 'vitest';

import {
  getPublishedFlowerLabels,
  getPublishedRegionSummaries,
  getPublishedSpotBySlug,
  getPublishedSpots,
} from './spotRepository';

describe('spotRepository', () => {
  it('maps raw published rows into UI spots with explicit slugs', () => {
    const spots = getPublishedSpots();

    expect(spots[0]?.id).toBe('spot-1');
    expect(spots[0]?.slug).toBe('yeouido-yunjung-ro');
    expect(getPublishedSpotBySlug('yeouido-yunjung-ro')?.place).toBe('여의도 윤중로');
  });

  it('derives flower labels and region summaries from published rows', () => {
    expect(getPublishedFlowerLabels()).toEqual(['벚꽃', '유채꽃', '튤립', '진달래']);
    expect(getPublishedRegionSummaries()).toEqual(['서울/경기', '제주']);
  });
});
