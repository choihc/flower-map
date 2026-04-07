import React from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardShell } from '@/features/dashboard/DashboardShell';
import { SpotForm } from '@/features/spots/SpotForm';
import { listFlowers } from '@/lib/data/flowers';
import { createSpot } from '@/lib/data/spots';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Database, SpotInsert } from '@/lib/types';

export default async function NewSpotPage() {
  const supabase = await createServerSupabaseClient();
  const dataClient = supabase as unknown as SupabaseClient<Database>;
  const flowers = await listFlowers(dataClient);

  async function submitAction(value: SpotInsert) {
    'use server';
    const client = (await createServerSupabaseClient()) as unknown as SupabaseClient<Database>;
    await createSpot(client, value);
    revalidatePath('/admin/spots');
    revalidatePath('/');
  }

  return (
    <DashboardShell title="새 명소 추가" description="명소 정보를 직접 입력하여 등록합니다.">
      <Card className="overflow-hidden">
        <CardHeader className="px-5 py-5">
          <CardTitle>명소 정보 입력</CardTitle>
          <CardDescription>새 명소를 등록하고 운영 화면에 반영합니다.</CardDescription>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <SpotForm flowers={flowers} submitAction={submitAction} />
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
