export type FlowerSpotTone = 'green' | 'pink' | 'yellow';

export type FlowerSpot = {
  id: string;
  slug: string;
  badge: string;
  bloomEndAt: string;
  bloomStartAt: string;
  bloomStatus: string;
  description: string;
  eventEndsIn?: string;
  fee: string;
  festivalDate: string;
  flower: string;
  flowerIsActive: boolean;
  flowerThumbnailUrl: string | null;
  helper: string;
  latitude: number;
  longitude: number;
  location: string;
  parking: string;
  place: string;
  thumbnailUrl: string | null;
  tone: FlowerSpotTone;
  nowScore?: number;
  bloomScore?: number;
  trendScore?: number;
  yoyScore?: number;
  nowScoreAt?: Date;
};

export interface SpotVideo {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  publishedAt: Date;
}

export interface SpotBlog {
  url: string;
  title: string;
  bloggerName: string;
  postedAt: Date;
}

export type PublishedSpotFlower = {
  name_ko: string;
  thumbnail_url: string | null;
  is_active: boolean;
};

export type PublishedSpotRow = {
  id: string;
  slug: string;
  name: string;
  flower: PublishedSpotFlower;
  region_secondary: string;
  description: string;
  short_tip: string;
  admission_fee: string | null;
  parking_info: string | null;
  festival_start_at: string | null;
  festival_end_at: string | null;
  bloom_start_at: string;
  bloom_end_at: string;
  is_featured: boolean;
  latitude: number;
  longitude: number;
  thumbnail_url: string | null;
  bloom_score?: number | null;
  trend_score?: number | null;
  content_score?: number | null;
  yoy_score?: number | null;
  now_score?: number | null;
  now_score_at?: string | null;
};

export type StayType = 'city' | 'resort' | 'poolvilla' | 'onsen' | 'kids' | 'ocean' | 'island';

export type StayRating = {
  score: number;
  url: string;
};

export type Stay = {
  id: string;
  slug: string;
  name: string;
  regionPrimary: string;
  regionSecondary: string;
  address: string;
  latitude: number;
  longitude: number;
  stayType: StayType;
  seasonTags: string[];
  seasonWindowStart: string | null;
  seasonWindowEnd: string | null;
  shortTagline: string;
  description: string;
  recommendationPoints: string[];
  tripcomBookingUrl: string | null;
  thumbnailUrl: string | null;
  bookingQueryOverride: string | null;
  naverRating: StayRating | null;
  googleRating: StayRating | null;
  ratingCapturedAt: string | null;
  isFeatured: boolean;
  displayOrder: number;
};

export type StayRow = {
  id: string;
  slug: string;
  name: string;
  region_primary: string;
  region_secondary: string;
  address: string;
  latitude: number;
  longitude: number;
  stay_type: StayType;
  season_tags: string[] | null;
  season_window_start: string | null;
  season_window_end: string | null;
  short_tagline: string;
  description: string;
  recommendation_points: string[] | null;
  tripcom_booking_url: string | null;
  thumbnail_url: string | null;
  booking_query_override: string | null;
  naver_rating_score: number | null;
  naver_rating_url: string | null;
  google_rating_score: number | null;
  google_rating_url: string | null;
  rating_captured_at: string | null;
  is_featured: boolean;
  display_order: number;
};

export type HomeCurationSlot = {
  id: string;
  slotKey: string;
  title: string;
  subtitle: string | null;
  ctaRoute: string;
  ctaLabel: string;
  coverImageUrl: string | null;
  isActive: boolean;
  displayOrder: number;
};

export type HomeCurationRow = {
  id: string;
  slot_key: string;
  title: string;
  subtitle: string | null;
  cta_route: string;
  cta_label: string;
  cover_image_url: string | null;
  is_active: boolean;
  display_order: number;
};

export type StayVideo = SpotVideo;
export type StayBlog = SpotBlog;
