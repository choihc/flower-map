import { describe, expect, it } from 'vitest';

import { resolveSpotSlug } from './spotDetailRoute';

describe('resolveSpotSlug', () => {
  it('returns the slug only when a published spot exists for it', () => {
    expect(resolveSpotSlug('yeouido-yunjung-ro')).toBe('yeouido-yunjung-ro');
  });

  it('returns null for missing or unknown slugs', () => {
    expect(resolveSpotSlug(undefined)).toBeNull();
    expect(resolveSpotSlug('')).toBeNull();
    expect(resolveSpotSlug('definitely-not-a-spot')).toBeNull();
  });
});
