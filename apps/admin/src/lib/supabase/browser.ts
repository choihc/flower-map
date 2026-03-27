import { createBrowserClient } from '@supabase/ssr';

import type { Database } from '@/lib/types';

import { getPublicEnv } from '../env';

export function createBrowserSupabaseClient() {
  const { supabaseUrl, supabaseAnonKey } = getPublicEnv();

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
