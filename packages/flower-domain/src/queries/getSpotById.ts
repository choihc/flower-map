import { supabase } from '@flower-map/supabase';
import type { PublishedSpotRow } from '@flower-map/supabase';

import { mapSpotRow } from '../mappers/mapSpotRow';

const SPOT_SELECT = '*, flower:flowers(name_ko, thumbnail_url)';

export async function getSpotById(id: string) {
  const { data, error } = await supabase
    .from('spots')
    .select(SPOT_SELECT)
    .eq('status', 'published')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapSpotRow(data as PublishedSpotRow) : undefined;
}
