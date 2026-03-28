import { supabase } from '../lib/supabase';
import type { FlowerSpot } from './types';
import { toFlowerSpot } from './spotMappers';

export const spotKeys = {
  all: ['spots'] as const,
  detail: (slug: string) => ['spots', slug] as const,
};

export function toRegionSummary(regionSecondary: string) {
  const primaryRegion = regionSecondary.split(' ')[0];

  if (primaryRegion === '서울' || primaryRegion === '경기') {
    return '서울/경기';
  }

  return primaryRegion ?? regionSecondary;
}

export async function getPublishedSpots(): Promise<FlowerSpot[]> {
  const { data, error } = await supabase
    .from('spots')
    .select('*, flower:flowers(name_ko, thumbnail_url)')
    .eq('status', 'published')
    .order('display_order', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => toFlowerSpot(row as any));
}

export async function getPublishedSpotBySlug(slug: string): Promise<FlowerSpot | undefined> {
  const { data, error } = await supabase
    .from('spots')
    .select('*, flower:flowers(name_ko, thumbnail_url)')
    .eq('status', 'published')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;

  return data ? toFlowerSpot(data as any) : undefined;
}

function bloomProximityScore(spot: FlowerSpot, today: Date): number {
  const todayMs = today.getTime();
  const startMs = new Date(`${spot.bloomStartAt}T00:00:00`).getTime();
  const endMs = new Date(`${spot.bloomEndAt}T00:00:00`).getTime();

  if (todayMs >= startMs && todayMs <= endMs) {
    // 현재 개화 중: 종료일까지 남은 일수 (0~N, 작을수록 임박)
    return Math.floor((endMs - todayMs) / (1000 * 60 * 60 * 24));
  }

  if (todayMs < startMs) {
    // 아직 개화 전: 1000 + 개화까지 남은 일수
    return 1000 + Math.floor((startMs - todayMs) / (1000 * 60 * 60 * 24));
  }

  // 개화 종료: 우선순위 최하위
  return 99999;
}

export function deriveFlowerLabels(spots: FlowerSpot[]): string[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const bestScoreByFlower = new Map<string, number>();
  for (const spot of spots) {
    const score = bloomProximityScore(spot, today);
    const existing = bestScoreByFlower.get(spot.flower);
    if (existing === undefined || score < existing) {
      bestScoreByFlower.set(spot.flower, score);
    }
  }

  return [...bestScoreByFlower.entries()]
    .sort((a, b) => a[1] - b[1])
    .map(([flower]) => flower);
}

export function deriveRegionSummaries(spots: FlowerSpot[]): string[] {
  return [...new Set(spots.map((s) => toRegionSummary(s.location)))];
}
