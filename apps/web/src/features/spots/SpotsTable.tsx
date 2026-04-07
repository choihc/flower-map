'use client';

import React, { useCallback, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/features/dashboard/StatusBadge';
import type { FlowerRow, SpotRow, SpotStatus } from '@/lib/types';

import { bulkUpdateSpotStatusAction } from './actions';

type Props = {
  spots: SpotRow[];
  flowers: FlowerRow[];
};

export function SpotsTable({ spots, flowers }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<SpotStatus | 'all'>('all');
  const [flowerFilter, setFlowerFilter] = useState<string>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const flowerNameById = new Map(flowers.map((f) => [f.id, f.name_ko]));

  const filteredSpots = spots.filter((spot) => {
    if (
      search &&
      !spot.name.toLowerCase().includes(search.toLowerCase()) &&
      !spot.slug.includes(search.toLowerCase()) &&
      !spot.region_secondary.includes(search)
    ) {
      return false;
    }
    if (statusFilter !== 'all' && spot.status !== statusFilter) return false;
    if (flowerFilter !== 'all' && spot.flower_id !== flowerFilter) return false;
    return true;
  });

  const allSelected = filteredSpots.length > 0 && filteredSpots.every((s) => selected.has(s.id));
  const someSelected = filteredSpots.some((s) => selected.has(s.id)) && !allSelected;

  const toggleAll = useCallback(() => {
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        filteredSpots.forEach((s) => next.delete(s.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        filteredSpots.forEach((s) => next.add(s.id));
        return next;
      });
    }
  }, [allSelected, filteredSpots]);

  const toggleOne = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  function handleBulkStatus(status: SpotStatus) {
    const ids = Array.from(selected).filter((id) => filteredSpots.some((s) => s.id === id));
    if (ids.length === 0) return;
    startTransition(async () => {
      await bulkUpdateSpotStatusAction(ids, status);
      setSelected(new Set());
      router.refresh();
    });
  }

  const selectedInView = filteredSpots.filter((s) => selected.has(s.id)).length;

  return (
    <div className="space-y-3">
      {/* 필터 바 */}
      <Card className="bg-card/90 backdrop-blur">
        <CardContent className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,200px)_minmax(0,200px)_auto]">
          <div className="space-y-1.5">
            <label htmlFor="spot-search" className="text-sm font-medium text-foreground">
              검색
            </label>
            <Input
              id="spot-search"
              placeholder="명소명, 슬러그, 지역 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="spot-status-filter" className="text-sm font-medium text-foreground">
              상태
            </label>
            <Select
              id="spot-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as SpotStatus | 'all')}
            >
              <option value="all">전체 상태</option>
              <option value="draft">검토 중</option>
              <option value="published">게시됨</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="spot-flower-filter" className="text-sm font-medium text-foreground">
              꽃
            </label>
            <Select
              id="spot-flower-filter"
              value={flowerFilter}
              onChange={(e) => setFlowerFilter(e.target.value)}
            >
              <option value="all">모든 꽃</option>
              {flowers.map((flower) => (
                <option key={flower.id} value={flower.id}>
                  {flower.name_ko}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setFlowerFilter('all');
              }}
            >
              초기화
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 일괄 처리 바 */}
      {selectedInView > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
          <span className="text-sm font-medium text-foreground">{selectedInView}개 선택됨</span>
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="outline" disabled={isPending} onClick={() => handleBulkStatus('draft')}>
              검토 중으로 변경
            </Button>
            <Button size="sm" disabled={isPending} onClick={() => handleBulkStatus('published')}>
              게시됨으로 변경
            </Button>
          </div>
        </div>
      )}

      {/* 테이블 */}
      <Card className="overflow-hidden">
        <CardHeader className="px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>등록된 명소</CardTitle>
              <CardDescription className="mt-1">
                {filteredSpots.length === spots.length
                  ? `총 ${spots.length}개`
                  : `${filteredSpots.length}개 (전체 ${spots.length}개)`}
                 — 행을 클릭하면 상세 정보를 확인하고 수정할 수 있습니다.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 px-5">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border accent-primary"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={toggleAll}
                    aria-label="전체 선택"
                  />
                </TableHead>
                <TableHead>명소</TableHead>
                <TableHead className="w-[110px]">꽃</TableHead>
                <TableHead className="w-[150px]">지역</TableHead>
                <TableHead className="w-[100px]">상태</TableHead>
                <TableHead className="w-[80px] text-right">대표</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSpots.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    {spots.length === 0 ? '아직 등록된 명소가 없습니다.' : '검색 결과가 없습니다.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredSpots.map((spot) => (
                  <TableRow
                    key={spot.id}
                    className="cursor-pointer transition-colors hover:bg-muted/30"
                    onClick={() => router.push(`/admin/spots/${spot.id}`)}
                  >
                    <TableCell
                      className="px-5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-border accent-primary"
                        checked={selected.has(spot.id)}
                        onChange={() => toggleOne(spot.id)}
                        aria-label={`${spot.name} 선택`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="font-medium text-foreground">{spot.name}</div>
                        <div className="text-xs text-muted-foreground">{spot.slug}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {flowerNameById.get(spot.flower_id) ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {spot.region_secondary}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={spot.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={spot.is_featured ? 'default' : 'outline'}>
                        {spot.is_featured ? '대표' : '일반'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
