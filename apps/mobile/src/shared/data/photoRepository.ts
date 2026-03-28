import { supabase } from '../lib/supabase';

export type SpotPhoto = {
  id: string;
  spotId: string;
  url: string;
  sortOrder: number;
  caption: string | null;
  createdAt: string;
};

type SpotPhotoRow = {
  id: string;
  spot_id: string;
  url: string;
  sort_order: number;
  caption: string | null;
  created_at: string;
};

function toSpotPhoto(row: SpotPhotoRow): SpotPhoto {
  return {
    id: row.id,
    spotId: row.spot_id,
    url: row.url,
    sortOrder: row.sort_order,
    caption: row.caption,
    createdAt: row.created_at,
  };
}

export const photoKeys = {
  bySpot: (spotId: string) => ['photos', spotId] as const,
};

export async function getPhotosBySpotId(spotId: string): Promise<SpotPhoto[]> {
  const { data, error } = await supabase
    .from('spot_photos')
    .select('*')
    .eq('spot_id', spotId)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => toSpotPhoto(row as SpotPhotoRow));
}
