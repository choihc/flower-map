import type { PublicSpot } from '@/lib/data/publicSpots';

export type PublicSpotTone = 'green' | 'pink' | 'yellow';

export type PublicSpotViewModel = PublicSpot & {
  badge: string;
  bloomStatus: string;
  eventEndsIn?: string;
  tone: PublicSpotTone;
};

function toFlowerTone(flowerName: string): PublicSpotTone {
  if (flowerName === '유채꽃') {
    return 'yellow';
  }

  if (flowerName === '벚꽃' || flowerName === '진달래') {
    return 'pink';
  }

  return 'green';
}

function getBloomDaysRemaining(spot: PublicSpot, now: Date): number {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const end = new Date(`${spot.bloomEndAt}T00:00:00`);
  return Math.floor((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getBloomDaysUntilStart(spot: PublicSpot, now: Date): number {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const start = new Date(`${spot.bloomStartAt}T00:00:00`);
  return Math.floor((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function toBadgeLabel(spot: PublicSpot, now: Date): string {
  const daysRemaining = getBloomDaysRemaining(spot, now);
  const daysUntilStart = getBloomDaysUntilStart(spot, now);

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

  if (spot.flower === '튤립') {
    return '가족 나들이 추천';
  }

  if (spot.flower === '진달래') {
    return '산책 코스 추천';
  }

  return '지금 방문 추천';
}

function toBloomStatus(spot: PublicSpot, now: Date): string {
  const daysRemaining = getBloomDaysRemaining(spot, now);
  const daysUntilStart = getBloomDaysUntilStart(spot, now);

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

function toEventEndsIn(spot: PublicSpot, now: Date) {
  if (spot.festivalDate === '일정 미정') {
    return undefined;
  }

  const end = spot.festivalDate.split(' - ')[1];

  if (!end) {
    return undefined;
  }

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const endDate = new Date(`${end.replaceAll('.', '-')}T00:00:00`);
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const daysRemaining = Math.floor((endDate.getTime() - today.getTime()) / millisecondsPerDay) + 1;

  if (daysRemaining <= 0) {
    return undefined;
  }

  return `D-${daysRemaining}`;
}

export function toPublicSpotViewModel(spot: PublicSpot, now = new Date()): PublicSpotViewModel {
  return {
    ...spot,
    badge: toBadgeLabel(spot, now),
    bloomStatus: toBloomStatus(spot, now),
    eventEndsIn: toEventEndsIn(spot, now),
    tone: toFlowerTone(spot.flower),
  };
}

export function toPublicSpotViewModels(spots: PublicSpot[], now = new Date()): PublicSpotViewModel[] {
  return spots.map((spot) => toPublicSpotViewModel(spot, now));
}
