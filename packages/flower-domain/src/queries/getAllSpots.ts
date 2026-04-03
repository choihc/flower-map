import { supabase } from '@flower-map/supabase';
import type { PublishedSpotRow } from '@flower-map/supabase';

import { mapSpotRow } from '../mappers/mapSpotRow';

const SPOT_SELECT = '*, flower:flowers(name_ko, thumbnail_url)';

export async function getAllSpots() {
  const { data, error } = await supabase
    .from('spots')
    .select(SPOT_SELECT)
    .eq('status', 'published')
    .order('display_order', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapSpotRow(row as PublishedSpotRow));
}
