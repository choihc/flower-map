import { getPublishedSpotBySlug } from '../../shared/data/spotRepository';

export function resolveSpotSlug(slug: string | string[] | undefined): string | null {
  if (typeof slug !== 'string' || !slug) {
    return null;
  }

  return getPublishedSpotBySlug(slug) ? slug : null;
}
