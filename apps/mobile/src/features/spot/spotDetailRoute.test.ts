import { describe, expect, it } from 'vitest';

import { resolveSpotSlug } from './spotDetailRoute';

describe('resolveSpotSlug', () => {
  it('returns the slug string for any valid non-empty string', () => {
    expect(resolveSpotSlug('yeouido-yunjung-ro')).toBe('yeouido-yunjung-ro');
    expect(resolveSpotSlug('definitely-not-a-spot')).toBe('definitely-not-a-spot');
  });

  it('returns null for undefined or empty inputs', () => {
    expect(resolveSpotSlug(undefined)).toBeNull();
    expect(resolveSpotSlug('')).toBeNull();
  });
});
