import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';

import { getAdminAccessState } from '@/lib/auth/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const { isAdmin, user } = await getAdminAccessState(supabase as never);

  if (user == null || !isAdmin) {
    redirect('/login');
  }

  return children;
}
