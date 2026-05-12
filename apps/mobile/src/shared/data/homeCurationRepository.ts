import { supabase } from '../lib/supabase';
import { toHomeCurationSlot } from './homeCurationMappers';
import type { HomeCurationSlot } from './types';

export const homeCurationKeys = {
  all: ['homeCuration'] as const,
  active: ['homeCuration', 'active'] as const,
};

export async function getActiveHomeCurationSlots(): Promise<HomeCurationSlot[]> {
  const { data, error } = await supabase
    .from('home_curation')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => toHomeCurationSlot(row as any));
}
