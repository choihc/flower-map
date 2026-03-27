import React from 'react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { SpotStatus } from '@/lib/types';

import { MetricCard } from './MetricCard';
import { QuickActionPanel } from './QuickActionPanel';
import { SectionHeader } from './SectionHeader';
import { StatusBadge } from './StatusBadge';

type DashboardHomeMetrics = {
  flowers: number;
  spots: number;
  draftSpots: number;
  publishedSpots: number;
};

type RecentSpot = {
  id: string;
  name: string;
  flowerName: string;
  status: SpotStatus;
  region: string;
};

type DashboardHomeProps = {
  metrics: DashboardHomeMetrics;
  recentSpots: RecentSpot[];
};

export function DashboardHome({ metrics, recentSpots }: DashboardHomeProps) {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <SectionHeader
          title="한눈에 보기"
          description="운영 상태를 빠르게 확인하고 다음 작업으로 바로 이어갈 수 있습니다."
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="꽃" value={metrics.flowers} caption="등록된 꽃 마스터" />
          <MetricCard label="명소" value={metrics.spots} caption="전체 명소 수" />
          <MetricCard label="검토 중" value={metrics.draftSpots} caption="처리 대기 항목" />
          <MetricCard label="게시됨" value={metrics.publishedSpots} caption="사용자에게 보이는 항목" />
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader title="바로가기" description="가장 자주 쓰는 관리 작업으로 이동합니다." />
        <QuickActionPanel />
      </section>

      <section className="space-y-4">
        <SectionHeader title="최근 명소" description="최근에 추가되거나 수정된 항목을 확인합니다." />
        <div className="rounded-[28px] border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>명소</TableHead>
                <TableHead>꽃</TableHead>
                <TableHead>지역</TableHead>
                <TableHead className="text-right">상태</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentSpots.length > 0 ? (
                recentSpots.map((spot) => (
                  <TableRow key={spot.id}>
                    <TableCell className="font-medium text-foreground">{spot.name}</TableCell>
                    <TableCell className="text-muted-foreground">{spot.flowerName}</TableCell>
                    <TableCell className="text-muted-foreground">{spot.region}</TableCell>
                    <TableCell className="text-right">
                      <StatusBadge status={spot.status} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                    최근 명소가 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
