'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUploader } from '@/features/spots/ImageUploader';
import type { StayRow } from '@/lib/types';

import { updateStayAgodaHotelIdAction, updateStayThumbnailAction } from './actions';

type Props = {
  stay: StayRow;
};

const STATUS_LABEL: Record<StayRow['status'], string> = {
  draft: '검토 중',
  published: '게시됨',
};

export function StayDetailForm({ stay }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const [agodaPending, startAgodaTransition] = useTransition();
  const [agodaMessage, setAgodaMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  function handleAgodaSubmit(formData: FormData) {
    const raw = String(formData.get('agoda_hotel_id_input') ?? '');
    setAgodaMessage(null);
    startAgodaTransition(async () => {
      try {
        await updateStayAgodaHotelIdAction(stay.id, raw);
        setAgodaMessage({ kind: 'success', text: 'Agoda 호텔 ID를 저장했습니다.' });
        router.refresh();
      } catch (error) {
        setAgodaMessage({
          kind: 'error',
          text: error instanceof Error ? error.message : 'Agoda 호텔 ID 저장 중 오류가 발생했습니다.',
        });
      }
    });
  }

  function handleSubmit(formData: FormData) {
    const thumbnailUrl = String(formData.get('thumbnail_url') ?? '');
    setMessage(null);
    startTransition(async () => {
      try {
        await updateStayThumbnailAction(stay.id, thumbnailUrl);
        setMessage({ kind: 'success', text: '대표 사진을 저장했습니다.' });
        router.refresh();
      } catch (error) {
        setMessage({
          kind: 'error',
          text: error instanceof Error ? error.message : '대표 사진 저장 중 오류가 발생했습니다.',
        });
      }
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <Card className="overflow-hidden">
        <CardHeader className="px-6 py-6">
          <CardTitle>대표 사진</CardTitle>
          <CardDescription>
            모바일 호캉스 리스트와 상세 hero에 노출되는 대표 이미지입니다. JPEG/PNG/WebP, 권장 16:9 비율.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <form action={handleSubmit} className="space-y-4">
            <ImageUploader defaultUrl={stay.thumbnail_url} />
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={isPending}>
                저장
              </Button>
              {message ? (
                <p
                  className={
                    message.kind === 'success'
                      ? 'text-sm text-foreground'
                      : 'text-sm text-destructive'
                  }
                  role={message.kind === 'error' ? 'alert' : undefined}
                >
                  {message.text}
                </p>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="px-6 py-6">
          <CardTitle>호텔 정보</CardTitle>
          <CardDescription>편집은 추후 JSON 재 import 또는 별도 폼에서 지원될 예정입니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 px-6 pb-6">
          <MetaRow label="이름" value={stay.name} />
          <MetaRow label="슬러그" value={stay.slug} />
          <MetaRow label="유형" value={stay.stay_type} />
          <MetaRow label="지역" value={`${stay.region_primary} · ${stay.region_secondary}`} />
          <MetaRow label="주소" value={stay.address} />
          <div className="flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-3">
            <span className="text-sm font-medium text-foreground">상태</span>
            <Badge
              variant={stay.status === 'published' ? 'default' : 'outline'}
              className="rounded-full px-2.5 py-1"
            >
              {STATUS_LABEL[stay.status]}
            </Badge>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-3">
            <span className="text-sm font-medium text-foreground">대표 노출</span>
            <Badge variant={stay.is_featured ? 'default' : 'outline'}>
              {stay.is_featured ? '대표' : '일반'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden xl:col-span-full">
        <CardHeader className="px-6 py-6">
          <CardTitle>Agoda 호텔 ID (예약 직링크)</CardTitle>
          <CardDescription>
            Agoda Partners 검색 결과 페이지 URL을 그대로 붙여넣거나 hid 숫자만 입력하세요.
            비우면 호텔명 검색으로 자동 fallback됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <form action={handleAgodaSubmit} className="space-y-4">
            <div className="rounded-2xl border border-border bg-background px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-foreground">현재 상태</span>
                {stay.agoda_hotel_id ? (
                  <Badge variant="default" className="rounded-full px-2.5 py-1">
                    직링크 활성
                  </Badge>
                ) : (
                  <Badge variant="outline" className="rounded-full px-2.5 py-1">
                    검색 fallback
                  </Badge>
                )}
              </div>
              {stay.agoda_hotel_id ? (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">저장된 hid</span>
                  <code className="rounded bg-blue-600 px-2 py-1 text-base font-semibold text-white">
                    {stay.agoda_hotel_id}
                  </code>
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  hid가 설정되지 않아 호텔명 검색으로 fallback됩니다.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="agoda_hotel_id_input" className="text-sm font-medium text-foreground">
                Agoda URL 또는 hid 입력
              </label>
              <input
                id="agoda_hotel_id_input"
                name="agoda_hotel_id_input"
                type="text"
                defaultValue={stay.agoda_hotel_id ?? ''}
                placeholder="https://www.agoda.com/partners/partnersearch.aspx?...hid=24180119 또는 24180119"
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm"
              />
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={agodaPending}>
                저장
              </Button>
              {agodaMessage ? (
                <p
                  className={
                    agodaMessage.kind === 'success'
                      ? 'text-sm text-foreground'
                      : 'text-sm text-destructive'
                  }
                  role={agodaMessage.kind === 'error' ? 'alert' : undefined}
                >
                  {agodaMessage.text}
                </p>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-background px-4 py-3">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <span className="text-sm text-muted-foreground text-right">{value}</span>
    </div>
  );
}
