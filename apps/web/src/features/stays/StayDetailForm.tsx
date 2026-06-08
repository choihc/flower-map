'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUploader } from '@/features/spots/ImageUploader';
import type { StayRow } from '@/lib/types';

import { updateStayAgodaHotelIdAction, updateStayThumbnailAction, updateStayTripcomUrlAction } from './actions';

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

  const [tripcomPending, startTripcomTransition] = useTransition();
  const [tripcomMessage, setTripcomMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

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

  function handleTripcomSubmit(formData: FormData) {
    const raw = String(formData.get('tripcom_booking_url_input') ?? '');
    setTripcomMessage(null);
    startTripcomTransition(async () => {
      try {
        await updateStayTripcomUrlAction(stay.id, raw);
        setTripcomMessage({ kind: 'success', text: 'trip.com 예약 URL을 저장했습니다.' });
        router.refresh();
      } catch (error) {
        setTripcomMessage({
          kind: 'error',
          text: error instanceof Error ? error.message : 'trip.com 예약 URL 저장 중 오류가 발생했습니다.',
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
          <CardTitle>trip.com 예약 URL</CardTitle>
          <CardDescription>
            trip.com 제휴 예약 URL 전체를 붙여넣으세요. 비우면 호텔명으로 trip.com 검색이 열립니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <form action={handleTripcomSubmit} className="space-y-4">
            <div className="rounded-2xl border border-border bg-background px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-foreground">현재 상태</span>
                {stay.tripcom_booking_url ? (
                  <Badge variant="default" className="rounded-full px-2.5 py-1">
                    직링크 활성
                  </Badge>
                ) : (
                  <Badge variant="outline" className="rounded-full px-2.5 py-1">
                    검색 fallback
                  </Badge>
                )}
              </div>
              {stay.tripcom_booking_url ? (
                <a
                  href={stay.tripcom_booking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block break-all text-sm text-blue-600 underline"
                >
                  {stay.tripcom_booking_url}
                </a>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  URL이 없어 호텔명 검색으로 fallback됩니다.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="tripcom_booking_url_input" className="text-sm font-medium text-foreground">
                trip.com 예약 URL 입력
              </label>
              <input
                id="tripcom_booking_url_input"
                name="tripcom_booking_url_input"
                type="text"
                defaultValue={stay.tripcom_booking_url ?? ''}
                placeholder="https://kr.trip.com/hotels/detail/?hotelId=...&Allianceid=...&SID=..."
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm"
              />
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={tripcomPending}>
                저장
              </Button>
              {tripcomMessage ? (
                <p
                  className={
                    tripcomMessage.kind === 'success'
                      ? 'text-sm text-foreground'
                      : 'text-sm text-destructive'
                  }
                  role={tripcomMessage.kind === 'error' ? 'alert' : undefined}
                >
                  {tripcomMessage.text}
                </p>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="overflow-hidden xl:col-span-full">
        <CardHeader className="px-6 py-6">
          <CardTitle>Agoda 호텔 ID</CardTitle>
          <CardDescription>
            Agoda 호텔 페이지 URL 전체를 붙여넣거나 숫자 hid를 입력하세요. 비우면 호텔명으로 Agoda 검색이 열립니다.
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
                <p className="mt-2 break-all text-sm text-foreground">hid: {stay.agoda_hotel_id}</p>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  hid가 없어 호텔명 검색으로 fallback됩니다.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="agoda_hotel_id_input" className="text-sm font-medium text-foreground">
                Agoda 호텔 ID / URL 입력
              </label>
              <input
                id="agoda_hotel_id_input"
                name="agoda_hotel_id_input"
                type="text"
                defaultValue={stay.agoda_hotel_id ?? ''}
                placeholder="24180119 또는 https://www.agoda.com/partners/partnersearch.aspx?...&hid=..."
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
