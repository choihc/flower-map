import React from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardShell } from '@/features/dashboard/DashboardShell';
import { FlowerForm } from '@/features/flowers/FlowerForm';
import { getFlower, updateFlower } from '@/lib/data/flowers';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Database, FlowerInsert } from '@/lib/types';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function FlowerDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const dataClient = supabase as unknown as SupabaseClient<Database>;

  const flower = await getFlower(dataClient, id);

  if (flower == null) {
    notFound();
  }

  async function updateAction(value: FlowerInsert) {
    'use server';
    const client = (await createServerSupabaseClient()) as unknown as SupabaseClient<Database>;
    await updateFlower(client, id, value);
    revalidatePath('/flowers');
    revalidatePath(`/flowers/${id}`);
    revalidatePath('/');
  }

  return (
    <DashboardShell title={flower.name_ko} description={flower.slug}>
      <Card className="overflow-hidden">
        <CardHeader className="px-5 py-5">
          <CardTitle>꽃 정보 수정</CardTitle>
          <CardDescription>정보를 수정하고 저장하면 즉시 반영됩니다.</CardDescription>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <FlowerForm defaultValue={flower} submitAction={updateAction} />
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
