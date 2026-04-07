import { createClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/types';

import { getServerEnv } from '../env';

export function createAdminSupabaseClient() {
  const { supabaseUrl, supabaseSecretKey } = getServerEnv();

  return createClient<Database>(supabaseUrl, supabaseSecretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
