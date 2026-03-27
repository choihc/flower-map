import React from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataListTable } from '@/features/dashboard/DataListTable';
import { DashboardShell } from '@/features/dashboard/DashboardShell';
import { MetricCard } from '@/features/dashboard/MetricCard';
import { SpotForm } from '@/features/spots/SpotForm';
import { listFlowers } from '@/lib/data/flowers';
import { createSpot, listSpots } from '@/lib/data/spots';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Database, FlowerRow, SpotInsert, SpotRow } from '@/lib/types';
import { StatusBadge } from '@/features/dashboard/StatusBadge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { TableCell, TableHead, TableRow } from '@/components/ui/table';

export default async function SpotsPage() {
  const supabase = await createServerSupabaseClient();
  const dataClient = supabase as unknown as SupabaseClient<Database>;
  const [flowers, spots]: [FlowerRow[], SpotRow[]] = await Promise.all([listFlowers(dataClient), listSpots(dataClient)]);
  const flowerNameById = new Map(flowers.map((flower) => [flower.id, flower.name_ko]));
  const featuredSpots = spots.filter((spot) => spot.is_featured).length;
  const draftSpots = spots.filter((spot) => spot.status === 'draft').length;
  const publishedSpots = spots.filter((spot) => spot.status === 'published').length;

  async function submitAction(value: SpotInsert) {
    'use server';

    const client = (await createServerSupabaseClient()) as unknown as SupabaseClient<Database>;
    await createSpot(client, value);
    revalidatePath('/');
    revalidatePath('/spots');
    revalidatePath('/spots/import');
  }

  return (
    <DashboardShell
      title="명소 관리"
      description="명소를 draft로 저장하고 검토 후 published로 전환합니다."
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="전체" value={spots.length} caption="등록된 명소 수" />
          <MetricCard label="검토 중" value={draftSpots} caption="검수 대기 항목" />
          <MetricCard label="게시됨" value={publishedSpots} caption="사용자 노출 항목" />
          <MetricCard label="대표" value={featuredSpots} caption="추천 명소 수" />
        </div>

        <Card className="bg-card/90 backdrop-blur">
          <CardContent className="grid gap-4 px-5 py-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,220px)_minmax(0,220px)_auto]">
            <div className="space-y-2">
              <label htmlFor="spot-search" className="text-sm font-medium text-foreground">
                검색
              </label>
              <Input id="spot-search" placeholder="명소명, 지역, 슬러그 검색" />
            </div>
            <div className="space-y-2">
              <label htmlFor="spot-status-filter" className="text-sm font-medium text-foreground">
                상태
              </label>
              <Select id="spot-status-filter" defaultValue="all">
                <option value="all">전체 상태</option>
                <option value="draft">검토 중</option>
                <option value="published">게시됨</option>
              </Select>
            </div>
            <div className="space-y-2">
              <label htmlFor="spot-flower-filter" className="text-sm font-medium text-foreground">
                꽃
              </label>
              <Select id="spot-flower-filter" defaultValue="all">
                <option value="all">모든 꽃</option>
                {flowers.map((flower) => (
                  <option key={flower.id} value={flower.id}>
                    {flower.name_ko}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="w-full">
                필터 초기화
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,420px)]">
          <DataListTable
            title="등록된 명소"
            description="최근 입력된 명소를 빠르게 검수합니다."
            hasItems={spots.length > 0}
            emptyState={
              <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                아직 등록된 명소가 없습니다.
              </TableCell>
            }
            columns={
              <>
                <TableHead>명소</TableHead>
                <TableHead>꽃</TableHead>
                <TableHead>지역</TableHead>
                <TableHead>상태</TableHead>
                <TableHead className="text-right">대표</TableHead>
              </>
            }
          >
            {spots.map((spot) => (
              <TableRow key={spot.id}>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium text-foreground">{spot.name}</div>
                    <div className="text-xs text-muted-foreground">{spot.slug}</div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{flowerNameById.get(spot.flower_id) ?? '알 수 없는 꽃'}</TableCell>
                <TableCell className="text-muted-foreground">{spot.region_secondary}</TableCell>
                <TableCell>
                  <StatusBadge status={spot.status} />
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant={spot.is_featured ? 'default' : 'outline'}>{spot.is_featured ? '대표' : '일반'}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </DataListTable>

          <Card className="overflow-hidden">
            <CardHeader className="px-5 py-5">
              <CardTitle>명소 정보 입력</CardTitle>
              <CardDescription>새 명소를 등록하고 운영 화면에 반영합니다.</CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <SpotForm flowers={flowers} submitAction={submitAction} />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
