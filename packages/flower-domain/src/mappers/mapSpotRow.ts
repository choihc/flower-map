import type { FlowerSpot, PublishedSpotRow } from '@flower-map/supabase';

export function mapSpotRow(row: PublishedSpotRow): FlowerSpot {
  return {
    id: row.id,
    slug: row.slug,
    place: row.name,
    flower: row.flower.name_ko,
    location: row.region_secondary,
    helper: row.short_tip,
    description: row.description,
    latitude: row.latitude,
    longitude: row.longitude,
    thumbnailUrl: row.thumbnail_url,
    flowerThumbnailUrl: row.flower.thumbnail_url,
    parking: row.parking_info ?? '주차 정보 없음',
    fee: row.admission_fee ?? '정보 없음',
    festivalDate:
      row.festival_start_at && row.festival_end_at
        ? `${row.festival_start_at} - ${row.festival_end_at}`
        : '행사 정보 없음',
    bloomStartAt: row.bloom_start_at,
    bloomEndAt: row.bloom_end_at,
    bloomStatus: '개화 정보 확인 필요',
    badge: row.is_featured ? '추천 명소' : '명소',
    tone: 'green',
  };
}
