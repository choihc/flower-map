import { supabase } from '../lib/supabase';
import type { FlowerSpot } from './types';
import { toFlowerSpot } from './spotMappers';

export const spotKeys = {
  all: ['spots'] as const,
  detail: (slug: string) => ['spots', slug] as const,
};

function toRegionSummary(regionSecondary: string) {
  const primaryRegion = regionSecondary.split(' ')[0];

  if (primaryRegion === '서울' || primaryRegion === '경기') {
    return '서울/경기';
  }

  return primaryRegion ?? regionSecondary;
}

export async function getPublishedSpots(): Promise<FlowerSpot[]> {
  const { data, error } = await supabase
    .from('spots')
    .select('*, flower:flowers(name_ko)')
    .eq('status', 'published')
    .order('display_order', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => toFlowerSpot(row as any));
}

export async function getPublishedSpotBySlug(slug: string): Promise<FlowerSpot | undefined> {
  const { data, error } = await supabase
    .from('spots')
    .select('*, flower:flowers(name_ko)')
    .eq('status', 'published')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;

  return data ? toFlowerSpot(data as any) : undefined;
}

export function deriveFlowerLabels(spots: FlowerSpot[]): string[] {
  return [...new Set(spots.map((s) => s.flower))];
}

export function deriveRegionSummaries(spots: FlowerSpot[]): string[] {
  return [...new Set(spots.map((s) => toRegionSummary(s.location)))];
}
