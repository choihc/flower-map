export function resolveSpotSlug(slug: string | string[] | undefined): string | null {
  if (typeof slug !== 'string' || !slug) {
    return null;
  }

  return slug;
}
