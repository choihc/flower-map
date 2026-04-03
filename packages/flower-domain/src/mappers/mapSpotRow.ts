import type { FlowerSpot, FlowerSpotTone, PublishedSpotRow } from '@flower-map/supabase';

function formatDateRange(start: string | null, end: string | null) {
  if (!start || !end) {
    return '일정 미정';
  }

  return `${start.split('-').join('.')} - ${end.split('-').join('.')}`;
}

function toFlowerTone(flowerName: string): FlowerSpotTone {
  if (flowerName === '유채꽃') {
    return 'yellow';
  }

  if (flowerName === '벚꽃' || flowerName === '진달래') {
    return 'pink';
  }

  return 'green';
}

function getBloomDaysRemaining(row: PublishedSpotRow, now: Date): number {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const end = new Date(`${row.bloom_end_at}T00:00:00`);
  return Math.floor((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getBloomDaysUntilStart(row: PublishedSpotRow, now: Date): number {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const start = new Date(`${row.bloom_start_at}T00:00:00`);
  return Math.floor((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function toBadgeLabel(row: PublishedSpotRow, now: Date): string {
  const daysRemaining = getBloomDaysRemaining(row, now);
  const daysUntilStart = getBloomDaysUntilStart(row, now);

  if (daysUntilStart > 7) {
    return '개화 예정';
  }

  if (daysUntilStart > 0) {
    return '곧 개화';
  }

  if (daysRemaining < 0) {
    return '개화 종료';
  }

  if (daysRemaining <= 7) {
    return '이번 주 절정';
  }

  if (row.flower.name_ko === '튤립') {
    return '가족 나들이 추천';
  }

  if (row.flower.name_ko === '진달래') {
    return '산책 코스 추천';
  }

  return '지금 방문 추천';
}

function toBloomStatus(row: PublishedSpotRow, now: Date): string {
  const daysRemaining = getBloomDaysRemaining(row, now);
  const daysUntilStart = getBloomDaysUntilStart(row, now);

  if (daysUntilStart > 0) {
    return '개화 예정';
  }

  if (daysRemaining < 0) {
    return '개화 종료';
  }

  if (daysRemaining <= 7) {
    return '지금 보기 좋아요';
  }

  return '개화 중';
}

function toEventEndsIn(row: PublishedSpotRow, now: Date) {
  if (!row.festival_end_at) {
    return undefined;
  }

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const endDate = new Date(`${row.festival_end_at}T00:00:00`);
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const daysRemaining = Math.floor((endDate.getTime() - today.getTime()) / millisecondsPerDay) + 1;

  if (daysRemaining <= 0) {
    return undefined;
  }

  return `D-${daysRemaining}`;
}

export function mapSpotRow(row: PublishedSpotRow, now = new Date()): FlowerSpot {
  return {
    id: row.id,
    slug: row.slug,
    badge: toBadgeLabel(row, now),
    bloomEndAt: row.bloom_end_at,
    bloomStartAt: row.bloom_start_at,
    bloomStatus: toBloomStatus(row, now),
    description: row.description,
    eventEndsIn: toEventEndsIn(row, now),
    fee: row.admission_fee ?? '정보 없음',
    festivalDate: formatDateRange(row.festival_start_at, row.festival_end_at),
    flower: row.flower.name_ko,
    helper: row.short_tip,
    latitude: row.latitude,
    longitude: row.longitude,
    location: row.region_secondary,
    parking: row.parking_info ?? '정보 없음',
    place: row.name,
    flowerThumbnailUrl: row.flower.thumbnail_url,
    thumbnailUrl: row.thumbnail_url,
    tone: toFlowerTone(row.flower.name_ko),
  };
}
