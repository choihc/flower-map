'use client';

import { useState } from 'react';

import type { FlowerInsert } from '@/lib/types';

import { flowerSchema } from './flowerSchema';

type FlowerFormProps = {
  defaultValue?: Partial<FlowerInsert>;
  onSubmit?: (value: FlowerInsert) => Promise<void> | void;
};

export function FlowerForm({ defaultValue, onSubmit }: FlowerFormProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setErrorMessage(null);
    setSuccessMessage(null);

    const parsed = flowerSchema.safeParse({
      slug: String(formData.get('slug') ?? ''),
      name_ko: String(formData.get('name_ko') ?? ''),
      name_en: normalizeOptionalText(formData.get('name_en')),
      color_hex: String(formData.get('color_hex') ?? ''),
      season_start_month: Number(formData.get('season_start_month')),
      season_end_month: Number(formData.get('season_end_month')),
      sort_order: Number(formData.get('sort_order') ?? 0),
      is_active: formData.get('is_active') === 'on',
    });

    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? '입력값을 확인해 주세요.');
      return;
    }

    await onSubmit?.(parsed.data);
    setSuccessMessage('꽃 정보를 준비했습니다.');
  }

  return (
    <form action={handleSubmit}>
      <div>
        <label htmlFor="flower-slug">슬러그</label>
        <input id="flower-slug" name="slug" defaultValue={defaultValue?.slug ?? ''} required />
      </div>
      <div>
        <label htmlFor="flower-name-ko">꽃 이름(한글)</label>
        <input id="flower-name-ko" name="name_ko" defaultValue={defaultValue?.name_ko ?? ''} required />
      </div>
      <div>
        <label htmlFor="flower-name-en">꽃 이름(영문)</label>
        <input id="flower-name-en" name="name_en" defaultValue={defaultValue?.name_en ?? ''} />
      </div>
      <div>
        <label htmlFor="flower-color">대표 색상</label>
        <input id="flower-color" name="color_hex" defaultValue={defaultValue?.color_hex ?? '#F6B7C1'} required />
      </div>
      <div>
        <label htmlFor="flower-season-start">시즌 시작 월</label>
        <input
          id="flower-season-start"
          name="season_start_month"
          type="number"
          min={1}
          max={12}
          defaultValue={defaultValue?.season_start_month ?? 3}
          required
        />
      </div>
      <div>
        <label htmlFor="flower-season-end">시즌 종료 월</label>
        <input
          id="flower-season-end"
          name="season_end_month"
          type="number"
          min={1}
          max={12}
          defaultValue={defaultValue?.season_end_month ?? 4}
          required
        />
      </div>
      <div>
        <label htmlFor="flower-sort-order">정렬 순서</label>
        <input id="flower-sort-order" name="sort_order" type="number" defaultValue={defaultValue?.sort_order ?? 0} />
      </div>
      <div>
        <label htmlFor="flower-is-active">활성화</label>
        <input
          id="flower-is-active"
          name="is_active"
          type="checkbox"
          defaultChecked={defaultValue?.is_active ?? true}
        />
      </div>
      {errorMessage ? <p role="alert">{errorMessage}</p> : null}
      {successMessage ? <p>{successMessage}</p> : null}
      <button type="submit">꽃 저장 준비</button>
    </form>
  );
}

function normalizeOptionalText(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
