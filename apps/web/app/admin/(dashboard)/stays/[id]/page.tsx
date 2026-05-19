import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { SupabaseClient } from '@supabase/supabase-js';

import { Button } from '@/components/ui/button';
import { DashboardShell } from '@/features/dashboard/DashboardShell';
import { StayDetailForm } from '@/features/stays/StayDetailForm';
import { findStayById } from '@/lib/data/stays';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/types';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function StayDetailPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createServerSupabaseClient();
  const client = supabase as unknown as SupabaseClient<Database>;
  const stay = await findStayById(client, id);

  if (stay == null) {
    notFound();
  }

  return (
    <DashboardShell
      title={stay.name}
      description={`${stay.region_primary} · ${stay.region_secondary} — 대표 사진을 관리합니다.`}
      actions={
        <Link href="/admin/stays">
          <Button variant="outline">목록으로</Button>
        </Link>
      }
    >
      <StayDetailForm stay={stay} />
    </DashboardShell>
  );
}
