'use client';

import React, { useCallback, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { StayRow, StayStatus } from '@/lib/types';

import { bulkUpdateStayStatusAction } from './actions';

type Props = {
  stays: StayRow[];
};

const STATUS_LABEL: Record<StayStatus, string> = {
  draft: '검토 중',
  published: '게시됨',
};

export function StaysTable({ stays }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StayStatus | 'all'>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filteredStays = stays.filter((stay) => {
    if (search) {
      const q = search.toLowerCase();
      const matched =
        stay.name.toLowerCase().includes(q) ||
        stay.slug.toLowerCase().includes(q) ||
        stay.region_secondary.includes(search);
      if (!matched) return false;
    }
    if (statusFilter !== 'all' && stay.status !== statusFilter) return false;
    return true;
  });

  const allSelected = filteredStays.length > 0 && filteredStays.every((s) => selected.has(s.id));
  const someSelected = filteredStays.some((s) => selected.has(s.id)) && !allSelected;

  const toggleAll = useCallback(() => {
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        filteredStays.forEach((s) => next.delete(s.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        filteredStays.forEach((s) => next.add(s.id));
        return next;
      });
    }
  }, [allSelected, filteredStays]);

  const toggleOne = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  function handleBulkStatus(status: StayStatus) {
    const ids = Array.from(selected).filter((id) => filteredStays.some((s) => s.id === id));
    if (ids.length === 0) return;
    startTransition(async () => {
      await bulkUpdateStayStatusAction(ids, status);
      setSelected(new Set());
      router.refresh();
    });
  }

  const selectedInView = filteredStays.filter((s) => selected.has(s.id)).length;

  return (
    <div className="space-y-3">
      {/* 필터 바 */}
      <Card className="bg-card/90 backdrop-blur">
        <CardContent className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,200px)_auto]">
          <div className="space-y-1.5">
            <label htmlFor="stay-search" className="text-sm font-medium text-foreground">
              검색
            </label>
            <Input
              id="stay-search"
              placeholder="호텔명, 슬러그, 지역 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="stay-status-filter" className="text-sm font-medium text-foreground">
              상태
            </label>
            <Select
              id="stay-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StayStatus | 'all')}
            >
              <option value="all">전체 상태</option>
              <option value="draft">검토 중</option>
              <option value="published">게시됨</option>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
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
          <CardTitle>등록된 호텔</CardTitle>
          <CardDescription className="mt-1">
            {filteredStays.length === stays.length
              ? `총 ${stays.length}개`
              : `${filteredStays.length}개 (전체 ${stays.length}개)`}
            {' — 게시됨 상태의 호텔만 모바일 앱에 노출됩니다. 행을 클릭하면 상세 페이지로 이동합니다.'}
          </CardDescription>
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
                <TableHead>호텔</TableHead>
                <TableHead className="w-[110px]">유형</TableHead>
                <TableHead className="w-[150px]">지역</TableHead>
                <TableHead className="w-[100px]">상태</TableHead>
                <TableHead className="w-[80px] text-right">대표</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStays.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    {stays.length === 0 ? '아직 등록된 호텔이 없습니다.' : '검색 결과가 없습니다.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredStays.map((stay) => (
                  <TableRow
                    key={stay.id}
                    className="cursor-pointer transition-colors hover:bg-muted/30"
                    onClick={() => router.push(`/admin/stays/${stay.id}`)}
                  >
                    <TableCell className="px-5" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-border accent-primary"
                        checked={selected.has(stay.id)}
                        onChange={() => toggleOne(stay.id)}
                        aria-label={`${stay.name} 선택`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="font-medium text-foreground">{stay.name}</div>
                        <div className="text-xs text-muted-foreground">{stay.slug}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{stay.stay_type}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {stay.region_primary} · {stay.region_secondary}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={stay.status === 'published' ? 'default' : 'outline'}
                        className="rounded-full px-2.5 py-1"
                      >
                        {STATUS_LABEL[stay.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={stay.is_featured ? 'default' : 'outline'}>
                        {stay.is_featured ? '대표' : '일반'}
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
