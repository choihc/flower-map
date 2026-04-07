import { createClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/types';

import { getPublicEnv } from '../env';

export function createPublicServerSupabaseClient() {
  const { supabaseUrl, supabasePublishableKey } = getPublicEnv();

  return createClient<Database>(supabaseUrl, supabasePublishableKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
