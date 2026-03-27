import React from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';

import { DashboardHome } from '@/features/dashboard/DashboardHome';
import { DashboardShell } from '@/features/dashboard/DashboardShell';
import { listFlowers } from '@/lib/data/flowers';
import { listSpots } from '@/lib/data/spots';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Database, FlowerRow, SpotRow } from '@/lib/types';

export default async function HomePage() {
  const supabase = (await createServerSupabaseClient()) as unknown as SupabaseClient<Database>;
  const [flowers, spots]: [FlowerRow[], SpotRow[]] = await Promise.all([listFlowers(supabase), listSpots(supabase)]);
  const flowerNameById = new Map(flowers.map((flower) => [flower.id, flower.name_ko]));

  return (
    <DashboardShell
      title="대시보드"
      description="현재 운영 상태와 검수 대기 항목을 한눈에 확인합니다."
    >
      <DashboardHome
        metrics={{
          flowers: flowers.length,
          spots: spots.length,
          draftSpots: spots.filter((spot) => spot.status === 'draft').length,
          publishedSpots: spots.filter((spot) => spot.status === 'published').length,
        }}
        recentSpots={spots.slice(0, 5).map((spot) => ({
          id: spot.id,
          name: spot.name,
          flowerName: flowerNameById.get(spot.flower_id) ?? '알 수 없는 꽃',
          status: spot.status,
          region: spot.region_secondary,
        }))}
      />
    </DashboardShell>
  );
}
