'use server';

import { revalidatePath } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';

import { bulkUpdateSpotStatus } from '@/lib/data/spots';
import type { Database, SpotStatus } from '@/lib/types';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function bulkUpdateSpotStatusAction(ids: string[], status: SpotStatus): Promise<void> {
  if (ids.length === 0) return;

  const supabase = await createServerSupabaseClient();
  const client = supabase as unknown as SupabaseClient<Database>;

  await bulkUpdateSpotStatus(client, ids, status);

  revalidatePath('/admin/spots');
  revalidatePath('/');
}
