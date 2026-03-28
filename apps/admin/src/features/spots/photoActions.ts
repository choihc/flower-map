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
  await createSpotPhoto(client, {
    spot_id: spotId,
    url: data.url,
    sort_order: data.sort_order,
    caption: data.caption,
  });
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
