import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/types';

type PublicSpotRow = {
  id: string;
  slug: string;
  name: string;
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
  flower: {
    name_ko: string;
    thumbnail_url: string | null;
    is_active: boolean;
  };
};

export type PublicSpot = {
  id: string;
  slug: string;
  place: string;
  flower: string;
  location: string;
  description: string;
  helper: string;
  fee: string;
  parking: string;
  festivalDate: string;
  bloomStartAt: string;
  bloomEndAt: string;
  thumbnailUrl: string | null;
  flowerThumbnailUrl: string | null;
  latitude: number;
  longitude: number;
  isFeatured: boolean;
};

function formatDateRange(start: string | null, end: string | null) {
  if (!start || !end) {
    return '일정 미정';
  }

  return `${start.replaceAll('-', '.')} - ${end.replaceAll('-', '.')}`;
}

function toPublicSpot(row: PublicSpotRow): PublicSpot {
  return {
    id: row.id,
    slug: row.slug,
    place: row.name,
    flower: row.flower.name_ko,
    location: row.region_secondary,
    description: row.description,
    helper: row.short_tip,
    fee: row.admission_fee ?? '정보 없음',
    parking: row.parking_info ?? '정보 없음',
    festivalDate: formatDateRange(row.festival_start_at, row.festival_end_at),
    bloomStartAt: row.bloom_start_at,
    bloomEndAt: row.bloom_end_at,
    thumbnailUrl: row.thumbnail_url,
    flowerThumbnailUrl: row.flower.thumbnail_url,
    latitude: row.latitude,
    longitude: row.longitude,
    isFeatured: row.is_featured,
  };
}

export async function listPublicSpots(client: SupabaseClient<Database>) {
  const { data, error } = await (client.from('spots') as any)
    .select('id, slug, name, region_secondary, description, short_tip, admission_fee, parking_info, festival_start_at, festival_end_at, bloom_start_at, bloom_end_at, is_featured, latitude, longitude, thumbnail_url, flower:flowers(name_ko, thumbnail_url, is_active)')
    .eq('status', 'published')
    .order('display_order', { ascending: true });

  if (error != null) {
    throw error;
  }

  return ((data ?? []) as PublicSpotRow[]).map(toPublicSpot);
}

export async function getPublicSpotBySlug(client: SupabaseClient<Database>, slug: string) {
  const { data, error } = await (client.from('spots') as any)
    .select('id, slug, name, region_secondary, description, short_tip, admission_fee, parking_info, festival_start_at, festival_end_at, bloom_start_at, bloom_end_at, is_featured, latitude, longitude, thumbnail_url, flower:flowers(name_ko, thumbnail_url, is_active)')
    .eq('status', 'published')
    .eq('slug', slug)
    .maybeSingle();

  if (error != null) {
    throw error;
  }

  return data ? toPublicSpot(data as PublicSpotRow) : null;
}
