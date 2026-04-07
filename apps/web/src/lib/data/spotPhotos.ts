import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database, SpotPhotoInsert, SpotPhotoRow } from '@/lib/types';

export async function listSpotPhotos(
  client: SupabaseClient<Database>,
  spotId: string,
): Promise<SpotPhotoRow[]> {
  const { data, error } = await (client.from('spot_photos') as any)
    .select('*')
    .eq('spot_id', spotId)
    .order('sort_order', { ascending: true });

  if (error != null) throw error;
  return (data ?? []) as SpotPhotoRow[];
}

export async function createSpotPhoto(
  client: SupabaseClient<Database>,
  input: SpotPhotoInsert,
): Promise<SpotPhotoRow> {
  const { data, error } = await (client.from('spot_photos') as any)
    .insert(input)
    .select()
    .single();

  if (error != null) throw error;
  return data as SpotPhotoRow;
}

export async function deleteSpotPhoto(
  client: SupabaseClient<Database>,
  photoId: string,
): Promise<void> {
  const { error } = await (client.from('spot_photos') as any)
    .delete()
    .eq('id', photoId);

  if (error != null) throw error;
}

export async function replaceSpotPhotos(
  client: SupabaseClient<Database>,
  spotId: string,
  photos: Array<{ url: string; sort_order?: number; caption?: string | null }>,
): Promise<void> {
  const { error: deleteError } = await (client.from('spot_photos') as any)
    .delete()
    .eq('spot_id', spotId);

  if (deleteError != null) throw deleteError;

  if (photos.length === 0) return;

  const { error: insertError } = await (client.from('spot_photos') as any).insert(
    photos.map((p) => ({
      spot_id: spotId,
      url: p.url,
      sort_order: p.sort_order ?? 0,
      caption: p.caption ?? null,
    })),
  );

  if (insertError != null) throw insertError;
}
