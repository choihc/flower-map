'use server';

import type { SupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

import {
  createSpotPhoto,
  deleteSpotPhoto,
  listSpotPhotos,
} from '@/lib/data/spotPhotos';
import type { Database, SpotPhotoRow } from '@/lib/types';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function addSpotPhotoAction(
  spotId: string,
  data: { url: string; sort_order: number; caption: string | null },
): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const client = supabase as unknown as SupabaseClient<Database>;

  const existing = await listSpotPhotos(client, spotId);
  const duplicate = existing.find((p) => p.url === data.url);

  if (duplicate) {
    await (client.from('spot_photos') as any)
      .update({ sort_order: data.sort_order, caption: data.caption })
      .eq('id', duplicate.id);
  } else {
    await createSpotPhoto(client, {
      spot_id: spotId,
      url: data.url,
      sort_order: data.sort_order,
      caption: data.caption,
    });
  }

  revalidatePath(`/spots/${spotId}`);
}

export async function deleteSpotPhotoAction(
  spotId: string,
  photoId: string,
): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const client = supabase as unknown as SupabaseClient<Database>;
  await deleteSpotPhoto(client, photoId);
  revalidatePath(`/spots/${spotId}`);
}

export async function listSpotPhotosAction(spotId: string): Promise<SpotPhotoRow[]> {
  const supabase = await createServerSupabaseClient();
  const client = supabase as unknown as SupabaseClient<Database>;
  return listSpotPhotos(client, spotId);
}
