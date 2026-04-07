import React from 'react';
import Link from 'next/link';
import type { SupabaseClient } from '@supabase/supabase-js';

import { Button } from '@/components/ui/button';
import { DashboardShell } from '@/features/dashboard/DashboardShell';
import { MetricCard } from '@/features/dashboard/MetricCard';
import { SpotsTable } from '@/features/spots/SpotsTable';
import { listFlowers } from '@/lib/data/flowers';
import { listSpots } from '@/lib/data/spots';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Database, FlowerRow, SpotRow } from '@/lib/types';

export default async function SpotsPage() {
  const supabase = await createServerSupabaseClient();
  const dataClient = supabase as unknown as SupabaseClient<Database>;
  const [flowers, spots]: [FlowerRow[], SpotRow[]] = await Promise.all([listFlowers(dataClient), listSpots(dataClient)]);

  const featuredSpots = spots.filter((spot) => spot.is_featured).length;
  const draftSpots = spots.filter((spot) => spot.status === 'draft').length;
  const publishedSpots = spots.filter((spot) => spot.status === 'published').length;

  return (
    <DashboardShell
      title="명소 관리"
      description="명소를 검토하고 게시 상태를 관리합니다."
      actions={
        <Link href="/admin/spots/new">
          <Button>새 명소 추가</Button>
        </Link>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="전체" value={spots.length} caption="등록된 명소 수" />
          <MetricCard label="검토 중" value={draftSpots} caption="검수 대기 항목" />
          <MetricCard label="게시됨" value={publishedSpots} caption="사용자 노출 항목" />
          <MetricCard label="대표" value={featuredSpots} caption="추천 명소 수" />
        </div>

        <SpotsTable spots={spots} flowers={flowers} />
      </div>
    </DashboardShell>
  );
}
