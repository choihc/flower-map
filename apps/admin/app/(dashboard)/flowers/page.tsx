import React from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardShell } from '@/features/dashboard/DashboardShell';
import { FlowerForm } from '@/features/flowers/FlowerForm';
import { createFlower, listFlowers } from '@/lib/data/flowers';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Database, FlowerInsert, FlowerRow } from '@/lib/types';

export default async function FlowersPage() {
  const supabase = await createServerSupabaseClient();
  const dataClient = supabase as unknown as SupabaseClient<Database>;
  const flowers: FlowerRow[] = await listFlowers(dataClient);

  async function submitAction(value: FlowerInsert) {
    'use server';

    const client = (await createServerSupabaseClient()) as unknown as SupabaseClient<Database>;
    await createFlower(client, value);
    revalidatePath('/flowers');
  }

  return (
    <DashboardShell
      title="꽃 관리"
      description="꽃 마스터를 등록하고 시즌, 색상, 표시 순서를 관리합니다."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <Card className="overflow-hidden">
          <CardHeader className="px-5 py-5">
            <CardTitle>등록된 꽃</CardTitle>
            <CardDescription>활성 상태와 시즌 정보를 빠르게 확인합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-5 pb-5">
            {flowers.length > 0 ? (
              flowers.map((flower) => (
                <article
                  key={flower.id}
                  className="rounded-2xl border border-border bg-background px-4 py-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full ring-1 ring-border"
                          style={{ backgroundColor: flower.color_hex }}
                          aria-hidden="true"
                        />
                        <h3 className="truncate text-sm font-semibold text-foreground">{flower.name_ko}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground">{flower.slug}</p>
                    </div>
                    <Badge variant={flower.is_active ? 'default' : 'outline'}>
                      {flower.is_active ? '활성' : '비활성'}
                    </Badge>
                  </div>
                  <dl className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                    <div className="space-y-1">
                      <dt>시즌</dt>
                      <dd className="font-medium text-foreground">
                        {flower.season_start_month}월 - {flower.season_end_month}월
                      </dd>
                    </div>
                    <div className="space-y-1">
                      <dt>정렬</dt>
                      <dd className="font-medium text-foreground">{flower.sort_order}</dd>
                    </div>
                  </dl>
                </article>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-border bg-background px-4 py-6 text-sm text-muted-foreground">
                아직 등록된 꽃이 없습니다.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="px-5 py-5">
            <CardTitle>꽃 정보 입력</CardTitle>
            <CardDescription>새 꽃을 등록하고 운영 화면에 반영합니다.</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <FlowerForm submitAction={submitAction} />
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
