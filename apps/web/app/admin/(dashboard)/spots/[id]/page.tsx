import React from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardShell } from '@/features/dashboard/DashboardShell';
import { SpotForm } from '@/features/spots/SpotForm';
import { listFlowers } from '@/lib/data/flowers';
import { getSpot, updateSpot } from '@/lib/data/spots';
import { listSpotPhotos } from '@/lib/data/spotPhotos';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Database, SpotInsert } from '@/lib/types';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function SpotDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const dataClient = supabase as unknown as SupabaseClient<Database>;

  const [spot, flowers, photos] = await Promise.all([
    getSpot(dataClient, id),
    listFlowers(dataClient),
    listSpotPhotos(dataClient, id),
  ]);

  if (spot == null) {
    notFound();
  }

  async function updateAction(value: SpotInsert) {
    'use server';
    const client = (await createServerSupabaseClient()) as unknown as SupabaseClient<Database>;
    await updateSpot(client, id, value);
    revalidatePath('/admin/spots');
    revalidatePath(`/admin/spots/${id}`);
    revalidatePath('/');
  }

  return (
    <DashboardShell title={spot.name} description={spot.slug}>
      <Card className="overflow-hidden">
        <CardHeader className="px-5 py-5">
          <CardTitle>명소 정보 수정</CardTitle>
          <CardDescription>정보를 수정하고 저장하면 즉시 반영됩니다.</CardDescription>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <SpotForm
            flowers={flowers}
            defaultValue={spot}
            submitAction={updateAction}
            spotId={id}
            initialPhotos={photos}
          />
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
