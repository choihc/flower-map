import { createClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/types';

import { getServerEnv } from '../env';

export function createAdminSupabaseClient() {
  const { supabaseUrl, supabaseServiceRoleKey } = getServerEnv();

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
