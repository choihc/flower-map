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

  return (
    <>
      <link
        rel="stylesheet"
        crossOrigin="anonymous"
        href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
      />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=JetBrains+Mono:wght@400;500&display=swap"
      />
      {children}
    </>
  );
}
