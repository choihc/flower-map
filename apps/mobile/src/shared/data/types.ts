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
};

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
};
