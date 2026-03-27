import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database, SpotInsert, SpotRow, SpotUpdate } from '@/lib/types';

type SpotWriteDraft = Omit<SpotInsert, 'id' | 'created_at' | 'updated_at'>;

function emptyToNull(value?: string | null) {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

export function buildSpotWriteInput(input: SpotWriteDraft): SpotInsert {
  return {
    ...input,
    parking_info: emptyToNull(input.parking_info),
    admission_fee: emptyToNull(input.admission_fee),
    festival_name: emptyToNull(input.festival_name),
    festival_start_at: emptyToNull(input.festival_start_at),
    festival_end_at: emptyToNull(input.festival_end_at),
    thumbnail_url: emptyToNull(input.thumbnail_url),
    source_note: emptyToNull(input.source_note),
    status: input.status ?? 'draft',
    source_type: input.source_type ?? 'manual_json',
    is_featured: input.is_featured ?? false,
    display_order: input.display_order ?? 0,
  };
}

export async function listSpots(client: SupabaseClient<Database>) {
  const { data, error } = await (client.from('spots') as any)
    .select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error != null) {
    throw error;
  }

  return data satisfies SpotRow[];
}

export async function createSpot(client: SupabaseClient<Database>, input: SpotWriteDraft) {
  const { data, error } = await (client.from('spots') as any).insert(buildSpotWriteInput(input)).select().single();

  if (error != null) {
    throw error;
  }

  return data satisfies SpotRow;
}

export async function updateSpot(client: SupabaseClient<Database>, id: string, input: SpotUpdate) {
  const { data, error } = await (client.from('spots') as any).update(input).eq('id', id).select().single();

  if (error != null) {
    throw error;
  }

  return data satisfies SpotRow;
}
