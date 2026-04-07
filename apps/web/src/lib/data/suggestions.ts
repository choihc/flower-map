import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/types';

export type SuggestionRow = {
  id: string;
  name: string;
  address: string | null;
  description: string | null;
  device_id: string;
  created_at: string;
};

export async function listSuggestions(client: SupabaseClient<Database>): Promise<SuggestionRow[]> {
  const { data, error } = await (client.from('spot_suggestions') as any)
    .select('*')
    .order('created_at', { ascending: false });

  if (error != null) throw error;
  return (data ?? []) as SuggestionRow[];
}
