import React from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';

import { DashboardShell } from '@/features/dashboard/DashboardShell';
import { MetricCard } from '@/features/dashboard/MetricCard';
import { StaysTable } from '@/features/stays/StaysTable';
import { listStays } from '@/lib/data/stays';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Database, StayRow } from '@/lib/types';

export default async function StaysPage() {
  const supabase = await createServerSupabaseClient();
  const dataClient = supabase as unknown as SupabaseClient<Database>;
  const stays: StayRow[] = await listStays(dataClient);

  const featuredStays = stays.filter((stay) => stay.is_featured).length;
  const draftStays = stays.filter((stay) => stay.status === 'draft').length;
  const publishedStays = stays.filter((stay) => stay.status === 'published').length;

  return (
    <DashboardShell
      title="호텔 관리"
      description="호캉스(stays) 도메인의 호텔을 검토하고 게시 상태를 관리합니다."
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="전체" value={stays.length} caption="등록된 호텔 수" />
          <MetricCard label="검토 중" value={draftStays} caption="검수 대기 항목" />
          <MetricCard label="게시됨" value={publishedStays} caption="사용자 노출 항목" />
          <MetricCard label="대표" value={featuredStays} caption="추천 호텔 수" />
        </div>

        <StaysTable stays={stays} />
      </div>
    </DashboardShell>
  );
}
