import type { Stay, StayRating, StayRow } from './types';

function toStayRating(score: number | null, url: string | null): StayRating | null {
  if (score == null || url == null) {
    return null;
  }

  const n = Number(score);
  if (!Number.isFinite(n)) {
    return null;
  }

  return { score: n, url };
}

export function toStay(row: StayRow): Stay {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    regionPrimary: row.region_primary,
    regionSecondary: row.region_secondary,
    address: row.address,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    stayType: row.stay_type,
    seasonTags: row.season_tags ?? [],
    seasonWindowStart: row.season_window_start,
    seasonWindowEnd: row.season_window_end,
    shortTagline: row.short_tagline,
    description: row.description,
    recommendationPoints: row.recommendation_points ?? [],
    thumbnailUrl: row.thumbnail_url,
    bookingQueryOverride: row.booking_query_override,
    naverRating: toStayRating(row.naver_rating_score, row.naver_rating_url),
    googleRating: toStayRating(row.google_rating_score, row.google_rating_url),
    ratingCapturedAt: row.rating_captured_at,
    isFeatured: row.is_featured,
    displayOrder: row.display_order,
  };
}

