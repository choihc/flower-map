'use client';

import React, { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { FormSection } from '@/components/ui/form-section';
import type { FlowerRow, SpotInsert, SpotPhotoRow } from '@/lib/types';
import { addSpotPhotoAction, deleteSpotPhotoAction, listSpotPhotosAction } from './photoActions';

import { buildSpotWriteInput } from '@/lib/data/spots';

import { spotSchema } from './spotSchema';
import { ImageUploader } from './ImageUploader';

type SpotFormProps = {
  defaultValue?: Partial<SpotInsert>;
  flowers: Array<Pick<FlowerRow, 'id' | 'name_ko' | 'slug'>>;
  submitAction: (value: SpotInsert) => Promise<void> | void;
  spotId?: string;
  initialPhotos?: SpotPhotoRow[];
};

export function SpotForm({ defaultValue, flowers, submitAction, spotId, initialPhotos }: SpotFormProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setErrorMessage(null);
    setSuccessMessage(null);

    const parsed = spotSchema.safeParse(
      buildSpotWriteInput({
        flower_id: String(formData.get('flower_id') ?? ''),
        slug: String(formData.get('slug') ?? ''),
        name: String(formData.get('name') ?? ''),
        region_primary: String(formData.get('region_primary') ?? ''),
        region_secondary: String(formData.get('region_secondary') ?? ''),
        address: String(formData.get('address') ?? ''),
        latitude: Number(formData.get('latitude')),
        longitude: Number(formData.get('longitude')),
        description: String(formData.get('description') ?? ''),
        short_tip: String(formData.get('short_tip') ?? ''),
        parking_info: getOptionalText(formData.get('parking_info')),
        admission_fee: getOptionalText(formData.get('admission_fee')),
        festival_name: getOptionalText(formData.get('festival_name')),
        festival_start_at: getOptionalText(formData.get('festival_start_at')),
        festival_end_at: getOptionalText(formData.get('festival_end_at')),
        bloom_start_at: String(formData.get('bloom_start_at') ?? ''),
        bloom_end_at: String(formData.get('bloom_end_at') ?? ''),
        thumbnail_url: getOptionalText(formData.get('thumbnail_url')),
        source_note: getOptionalText(formData.get('source_note')),
        status: formData.get('status') === 'published' ? 'published' : 'draft',
        display_order: Number(formData.get('display_order') ?? 0),
        is_featured: formData.get('is_featured') === 'on',
      }),
    );

    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? '입력값을 확인해 주세요.');
      return;
    }

    try {
      await submitAction(parsed.data);
      setSuccessMessage('명소 정보를 저장했습니다.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '명소 저장 중 오류가 발생했습니다.');
    }
  }

  return (
    <>
    <form action={handleSubmit} className="space-y-6">
      <FormSection
        title="기본 정보"
        description="명소를 식별하는 기본 항목과 연결할 꽃 종류를 입력합니다."
      >
        <div className="grid gap-4">
          <div className="space-y-2">
            <label htmlFor="spot-flower-id" className="text-sm font-medium text-foreground">
              꽃 종류
            </label>
            <Select id="spot-flower-id" name="flower_id" defaultValue={defaultValue?.flower_id ?? ''} required>
              <option value="" disabled>
                꽃을 선택해 주세요
              </option>
              {flowers.map((flower) => (
                <option key={flower.id} value={flower.id}>
                  {flower.name_ko} ({flower.slug})
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="spot-slug" className="text-sm font-medium text-foreground">
                슬러그
              </label>
              <Input id="spot-slug" name="slug" defaultValue={defaultValue?.slug ?? ''} required />
            </div>
            <div className="space-y-2">
              <label htmlFor="spot-name" className="text-sm font-medium text-foreground">
                명소 이름
              </label>
              <Input id="spot-name" name="name" defaultValue={defaultValue?.name ?? ''} required />
            </div>
          </div>
        </div>
      </FormSection>

      <Separator />

      <FormSection
        title="위치 정보"
        description="지역과 좌표를 입력해 지도와 목록 정렬에 활용합니다."
      >
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="spot-region-primary" className="text-sm font-medium text-foreground">
                1차 지역
              </label>
              <Input id="spot-region-primary" name="region_primary" defaultValue={defaultValue?.region_primary ?? ''} required />
            </div>
            <div className="space-y-2">
              <label htmlFor="spot-region-secondary" className="text-sm font-medium text-foreground">
                2차 지역
              </label>
              <Input
                id="spot-region-secondary"
                name="region_secondary"
                defaultValue={defaultValue?.region_secondary ?? ''}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="spot-address" className="text-sm font-medium text-foreground">
              주소
            </label>
            <Input id="spot-address" name="address" defaultValue={defaultValue?.address ?? ''} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="spot-latitude" className="text-sm font-medium text-foreground">
                위도
              </label>
              <Input
                id="spot-latitude"
                name="latitude"
                type="number"
                step="any"
                defaultValue={defaultValue?.latitude ?? 37.5665}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="spot-longitude" className="text-sm font-medium text-foreground">
                경도
              </label>
              <Input
                id="spot-longitude"
                name="longitude"
                type="number"
                step="any"
                defaultValue={defaultValue?.longitude ?? 126.978}
                required
              />
            </div>
          </div>
        </div>
      </FormSection>

      <Separator />

      <FormSection
        title="개화/축제 일정"
        description="개화 기간과 축제 일정을 함께 관리합니다."
      >
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="spot-bloom-start" className="text-sm font-medium text-foreground">
                개화 시작일
              </label>
              <Input
                id="spot-bloom-start"
                name="bloom_start_at"
                type="date"
                defaultValue={defaultValue?.bloom_start_at ?? ''}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="spot-bloom-end" className="text-sm font-medium text-foreground">
                개화 종료일
              </label>
              <Input
                id="spot-bloom-end"
                name="bloom_end_at"
                type="date"
                defaultValue={defaultValue?.bloom_end_at ?? ''}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="spot-festival-name" className="text-sm font-medium text-foreground">
              축제명
            </label>
            <Input id="spot-festival-name" name="festival_name" defaultValue={defaultValue?.festival_name ?? ''} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="spot-festival-start" className="text-sm font-medium text-foreground">
                축제 시작일
              </label>
              <Input
                id="spot-festival-start"
                name="festival_start_at"
                type="date"
                defaultValue={defaultValue?.festival_start_at ?? ''}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="spot-festival-end" className="text-sm font-medium text-foreground">
                축제 종료일
              </label>
              <Input
                id="spot-festival-end"
                name="festival_end_at"
                type="date"
                defaultValue={defaultValue?.festival_end_at ?? ''}
              />
            </div>
          </div>
        </div>
      </FormSection>

      <Separator />

      <FormSection
        title="이미지와 메모"
        description="운영 참고용 정보와 소개 문구를 기록합니다."
      >
        <div className="grid gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              썸네일 이미지
            </label>
            <ImageUploader defaultUrl={defaultValue?.thumbnail_url} />
          </div>
          <div className="space-y-2">
            <label htmlFor="spot-description" className="text-sm font-medium text-foreground">
              설명
            </label>
            <Textarea id="spot-description" name="description" defaultValue={defaultValue?.description ?? ''} required />
          </div>
          <div className="space-y-2">
            <label htmlFor="spot-short-tip" className="text-sm font-medium text-foreground">
              짧은 팁
            </label>
            <Textarea id="spot-short-tip" name="short_tip" defaultValue={defaultValue?.short_tip ?? ''} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="spot-parking-info" className="text-sm font-medium text-foreground">
                주차 정보
              </label>
              <Input id="spot-parking-info" name="parking_info" defaultValue={defaultValue?.parking_info ?? ''} />
            </div>
            <div className="space-y-2">
              <label htmlFor="spot-admission-fee" className="text-sm font-medium text-foreground">
                입장료
              </label>
              <Input id="spot-admission-fee" name="admission_fee" defaultValue={defaultValue?.admission_fee ?? ''} />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="spot-source-note" className="text-sm font-medium text-foreground">
              비고
            </label>
            <Input id="spot-source-note" name="source_note" defaultValue={defaultValue?.source_note ?? ''} />
          </div>
        </div>
      </FormSection>

      <Separator />

      <FormSection
        title="공개 상태"
        description="초안과 게시 상태를 전환합니다."
      >
        <div className="grid gap-4 sm:grid-cols-[minmax(0,180px)_minmax(0,180px)_minmax(0,1fr)]">
          <div className="space-y-2">
            <label htmlFor="spot-status" className="text-sm font-medium text-foreground">
              상태
            </label>
            <Select id="spot-status" name="status" defaultValue={defaultValue?.status ?? 'draft'}>
              <option value="draft">검토 중</option>
              <option value="published">게시됨</option>
            </Select>
          </div>
          <div className="space-y-2">
            <label htmlFor="spot-display-order" className="text-sm font-medium text-foreground">
              정렬 순서
            </label>
            <Input
              id="spot-display-order"
              name="display_order"
              type="number"
              defaultValue={defaultValue?.display_order ?? 0}
            />
          </div>
          <label
            htmlFor="spot-is-featured"
            className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground"
          >
            <input
              id="spot-is-featured"
              name="is_featured"
              type="checkbox"
              defaultChecked={defaultValue?.is_featured ?? false}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
            />
            대표 명소
          </label>
        </div>
        <p className="text-sm text-muted-foreground">
          검토 중인 명소는 draft로 저장되고, 게시되면 운영 화면에 노출됩니다.
        </p>
      </FormSection>

      {errorMessage ? <p role="alert">{errorMessage}</p> : null}
      {successMessage ? <p className="text-sm text-foreground">{successMessage}</p> : null}
      <div className="flex justify-end">
        <Button type="submit">명소 저장</Button>
      </div>
    </form>

      {spotId != null && (
        <SpotPhotoManager
          spotId={spotId}
          initialPhotos={initialPhotos ?? []}
        />
      )}
    </>
  );
}

function getOptionalText(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function SpotPhotoManager({
  spotId,
  initialPhotos,
}: {
  spotId: string;
  initialPhotos: SpotPhotoRow[];
}) {
  const [photos, setPhotos] = React.useState<SpotPhotoRow[]>(initialPhotos);
  const [url, setUrl] = React.useState('');
  const [sortOrder, setSortOrder] = React.useState(0);
  const [caption, setCaption] = React.useState('');
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  function handleAdd() {
    if (!url.trim()) return;
    setErrorMsg(null);
    startTransition(async () => {
      try {
        await addSpotPhotoAction(spotId, {
          url: url.trim(),
          sort_order: sortOrder,
          caption: caption.trim() || null,
        });
        setUrl('');
        setCaption('');
        setSortOrder(photos.length);
        const updated = await listSpotPhotosAction(spotId);
        setPhotos(updated);
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : '사진 추가 중 오류가 발생했습니다.');
      }
    });
  }

  function handleDelete(photoId: string) {
    startTransition(async () => {
      await deleteSpotPhotoAction(spotId, photoId);
      const updated = await listSpotPhotosAction(spotId);
      setPhotos(updated);
    });
  }

  return (
    <div className="mt-6 space-y-4">
      <Separator />
      <FormSection
        title="사진 관리"
        description="명소 갤러리에 표시할 외부 URL 사진을 관리합니다."
      >
        {photos.length > 0 && (
          <div className="space-y-2 mb-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-background p-3 text-sm"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={photo.caption ?? '사진'}
                  className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-foreground font-medium">{photo.url}</p>
                  <p className="text-muted-foreground text-xs">
                    순서: {photo.sort_order}{photo.caption != null ? ` · ${photo.caption}` : ''}
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => handleDelete(photo.id)}
                  disabled={isPending}
                >
                  삭제
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="grid gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">URL</label>
            <Input
              placeholder="https://example.com/photo.jpg"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isPending}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">순서</label>
              <Input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                disabled={isPending}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">캡션 (선택)</label>
              <Input
                placeholder="사진 설명"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>
          {errorMsg != null && (
            <p role="alert" className="text-sm text-destructive">{errorMsg}</p>
          )}
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={handleAdd}
              disabled={isPending || !url.trim()}
            >
              {isPending ? '처리 중...' : '사진 추가'}
            </Button>
          </div>
        </div>
      </FormSection>
    </div>
  );
}
