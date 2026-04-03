import { supabase } from '@flower-map/supabase';

import type { FlowerFilter } from '../types';

const SPOT_SELECT = 'flower:flowers(name_ko, thumbnail_url)';

type FlowerFilterRow = {
  flower:
    | {
        name_ko: string;
      }
    | Array<{
        name_ko: string;
      }>;
};

export async function getFlowerFilters(): Promise<FlowerFilter[]> {
  const { data, error } = await supabase
    .from('spots')
    .select(SPOT_SELECT)
    .eq('status', 'published')
    .order('display_order', { ascending: true });

  if (error) {
    throw error;
  }

  const names = new Set(
    (data ?? [])
      .map((row) => {
        const flower = (row as FlowerFilterRow).flower;
        return Array.isArray(flower) ? flower[0]?.name_ko : flower?.name_ko;
      })
      .filter((name): name is string => Boolean(name)),
  );

  return [...names].map((name) => ({
    label: name,
    value: name,
  }));
}
