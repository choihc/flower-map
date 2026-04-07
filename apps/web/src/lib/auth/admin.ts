import type { SupabaseClient, User } from '@supabase/supabase-js';

import type { Database } from '@/lib/types';

type AdminAccessState = {
  user: User | null;
  isAdmin: boolean;
};

export async function isAdminUser(client: SupabaseClient<Database>, userId: string) {
  const { data, error } = await (client.from('admin_users') as any).select('user_id').eq('user_id', userId).maybeSingle();

  if (error != null) {
    throw error;
  }

  return data != null;
}

export async function getAdminAccessState(client: SupabaseClient<Database>): Promise<AdminAccessState> {
  const {
    data: { user },
  } = await client.auth.getUser();

  if (user == null) {
    return {
      user: null,
      isAdmin: false,
    };
  }

  return {
    user,
    isAdmin: await isAdminUser(client, user.id),
  };
}
