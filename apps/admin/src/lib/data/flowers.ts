import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database, FlowerInsert, FlowerRow, FlowerUpdate } from '@/lib/types';

type FlowerWriteDraft = Omit<FlowerInsert, 'id' | 'created_at' | 'updated_at'>;

function emptyToNull(value?: string | null) {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

export function buildFlowerWriteInput(input: FlowerWriteDraft): FlowerInsert {
  return {
    ...input,
    name_en: emptyToNull(input.name_en),
    thumbnail_url: emptyToNull(input.thumbnail_url),
    sort_order: input.sort_order ?? 0,
    is_active: input.is_active ?? true,
  };
}

export async function listFlowers(client: SupabaseClient<Database>) {
  const flowersTable = client.from('flowers') as any;
  const { data, error } = await flowersTable.select('*').order('sort_order', { ascending: true }).order('created_at', {
    ascending: true,
  });

  if (error != null) {
    throw error;
  }

  return data satisfies FlowerRow[];
}

export async function createFlower(client: SupabaseClient<Database>, input: FlowerWriteDraft) {
  const flowersTable = client.from('flowers') as any;
  const { data, error } = await flowersTable.insert(buildFlowerWriteInput(input)).select().single();

  if (error != null) {
    throw error;
  }

  return data satisfies FlowerRow;
}

export async function updateFlower(client: SupabaseClient<Database>, id: string, input: FlowerUpdate) {
  const flowersTable = client.from('flowers') as any;
  const { data, error } = await flowersTable.update(input).eq('id', id).select().single();

  if (error != null) {
    throw error;
  }

  return data satisfies FlowerRow;
}
