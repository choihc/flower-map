import { createBrowserClient } from '@supabase/ssr';

import type { Database } from '@/lib/types';

import { getPublicEnv } from '../env';

export function createBrowserSupabaseClient() {
  const { supabaseUrl, supabasePublishableKey } = getPublicEnv();

  return createBrowserClient<Database>(supabaseUrl, supabasePublishableKey);
}
