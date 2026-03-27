'use client';

import { useState } from 'react';

import type { SpotInsert } from '@/lib/types';

import { buildSpotWriteInput } from '@/lib/data/spots';

import { spotSchema } from './spotSchema';

type SpotFormProps = {
  defaultValue?: Partial<SpotInsert>;
  onSubmit?: (value: SpotInsert) => Promise<void> | void;
};

export function SpotForm({ defaultValue, onSubmit }: SpotFormProps) {
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
      }),
    );

    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? '입력값을 확인해 주세요.');
      return;
    }

    await onSubmit?.(parsed.data);
    setSuccessMessage('명소 정보를 준비했습니다.');
  }

  return (
    <form action={handleSubmit}>
      <div>
        <label htmlFor="spot-flower-id">꽃 ID</label>
        <input id="spot-flower-id" name="flower_id" defaultValue={defaultValue?.flower_id ?? ''} required />
      </div>
      <div>
        <label htmlFor="spot-slug">슬러그</label>
        <input id="spot-slug" name="slug" defaultValue={defaultValue?.slug ?? ''} required />
      </div>
      <div>
        <label htmlFor="spot-name">명소 이름</label>
        <input id="spot-name" name="name" defaultValue={defaultValue?.name ?? ''} required />
      </div>
      <div>
        <label htmlFor="spot-region-primary">1차 지역</label>
        <input id="spot-region-primary" name="region_primary" defaultValue={defaultValue?.region_primary ?? ''} required />
      </div>
      <div>
        <label htmlFor="spot-region-secondary">2차 지역</label>
        <input
          id="spot-region-secondary"
          name="region_secondary"
          defaultValue={defaultValue?.region_secondary ?? ''}
          required
        />
      </div>
      <div>
        <label htmlFor="spot-address">주소</label>
        <input id="spot-address" name="address" defaultValue={defaultValue?.address ?? ''} required />
      </div>
      <div>
        <label htmlFor="spot-latitude">위도</label>
        <input id="spot-latitude" name="latitude" type="number" step="any" defaultValue={defaultValue?.latitude ?? 37.5665} required />
      </div>
      <div>
        <label htmlFor="spot-longitude">경도</label>
        <input
          id="spot-longitude"
          name="longitude"
          type="number"
          step="any"
          defaultValue={defaultValue?.longitude ?? 126.978}
          required
        />
      </div>
      <div>
        <label htmlFor="spot-description">설명</label>
        <textarea id="spot-description" name="description" defaultValue={defaultValue?.description ?? ''} required />
      </div>
      <div>
        <label htmlFor="spot-short-tip">짧은 팁</label>
        <textarea id="spot-short-tip" name="short_tip" defaultValue={defaultValue?.short_tip ?? ''} required />
      </div>
      <div>
        <label htmlFor="spot-parking-info">주차 정보</label>
        <input id="spot-parking-info" name="parking_info" defaultValue={defaultValue?.parking_info ?? ''} />
      </div>
      <div>
        <label htmlFor="spot-admission-fee">입장료</label>
        <input id="spot-admission-fee" name="admission_fee" defaultValue={defaultValue?.admission_fee ?? ''} />
      </div>
      <div>
        <label htmlFor="spot-festival-name">축제명</label>
        <input id="spot-festival-name" name="festival_name" defaultValue={defaultValue?.festival_name ?? ''} />
      </div>
      <div>
        <label htmlFor="spot-festival-start">축제 시작일</label>
        <input
          id="spot-festival-start"
          name="festival_start_at"
          type="date"
          defaultValue={defaultValue?.festival_start_at ?? ''}
        />
      </div>
      <div>
        <label htmlFor="spot-festival-end">축제 종료일</label>
        <input
          id="spot-festival-end"
          name="festival_end_at"
          type="date"
          defaultValue={defaultValue?.festival_end_at ?? ''}
        />
      </div>
      <div>
        <label htmlFor="spot-bloom-start">개화 시작일</label>
        <input id="spot-bloom-start" name="bloom_start_at" type="date" defaultValue={defaultValue?.bloom_start_at ?? ''} required />
      </div>
      <div>
        <label htmlFor="spot-bloom-end">개화 종료일</label>
        <input id="spot-bloom-end" name="bloom_end_at" type="date" defaultValue={defaultValue?.bloom_end_at ?? ''} required />
      </div>
      <div>
        <label htmlFor="spot-thumbnail-url">썸네일 URL</label>
        <input id="spot-thumbnail-url" name="thumbnail_url" type="url" defaultValue={defaultValue?.thumbnail_url ?? ''} />
      </div>
      <div>
        <label htmlFor="spot-source-note">비고</label>
        <input id="spot-source-note" name="source_note" defaultValue={defaultValue?.source_note ?? ''} />
      </div>
      <div>
        <label htmlFor="spot-status">상태</label>
        <select id="spot-status" name="status" defaultValue={defaultValue?.status ?? 'draft'}>
          <option value="draft">draft</option>
          <option value="published">published</option>
        </select>
      </div>
      {errorMessage ? <p role="alert">{errorMessage}</p> : null}
      {successMessage ? <p>{successMessage}</p> : null}
      <button type="submit">명소 저장 준비</button>
    </form>
  );
}

function getOptionalText(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
