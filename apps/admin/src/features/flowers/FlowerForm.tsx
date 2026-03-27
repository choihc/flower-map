'use client';

import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { FormSection } from '@/components/ui/form-section';
import type { FlowerInsert } from '@/lib/types';

import { flowerSchema } from './flowerSchema';

type FlowerFormProps = {
  defaultValue?: Partial<FlowerInsert>;
  submitAction?: (value: FlowerInsert) => Promise<void> | void;
};

export function FlowerForm({ defaultValue, submitAction }: FlowerFormProps) {
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

    try {
      await submitAction?.(parsed.data);
      setSuccessMessage('꽃 정보를 저장했습니다.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '꽃 저장 중 오류가 발생했습니다.');
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <FormSection
        title="기본 정보"
        description="꽃의 식별자와 화면에 노출될 이름, 대표 색상을 입력합니다."
      >
        <div className="grid gap-4">
          <div className="space-y-2">
            <label htmlFor="flower-slug" className="text-sm font-medium text-foreground">
              슬러그
            </label>
            <Input id="flower-slug" name="slug" defaultValue={defaultValue?.slug ?? ''} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="flower-name-ko" className="text-sm font-medium text-foreground">
                꽃 이름(한글)
              </label>
              <Input id="flower-name-ko" name="name_ko" defaultValue={defaultValue?.name_ko ?? ''} required />
            </div>
            <div className="space-y-2">
              <label htmlFor="flower-name-en" className="text-sm font-medium text-foreground">
                꽃 이름(영문)
              </label>
              <Input id="flower-name-en" name="name_en" defaultValue={defaultValue?.name_en ?? ''} />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="flower-color" className="text-sm font-medium text-foreground">
              대표 색상
            </label>
            <Input id="flower-color" name="color_hex" defaultValue={defaultValue?.color_hex ?? '#F6B7C1'} required />
          </div>
        </div>
      </FormSection>

      <Separator />

      <FormSection
        title="시즌 정보"
        description="꽃이 피는 시작과 종료 월을 지정합니다."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="flower-season-start" className="text-sm font-medium text-foreground">
              시즌 시작 월
            </label>
            <Input
              id="flower-season-start"
              name="season_start_month"
              type="number"
              min={1}
              max={12}
              defaultValue={defaultValue?.season_start_month ?? 3}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="flower-season-end" className="text-sm font-medium text-foreground">
              시즌 종료 월
            </label>
            <Input
              id="flower-season-end"
              name="season_end_month"
              type="number"
              min={1}
              max={12}
              defaultValue={defaultValue?.season_end_month ?? 4}
              required
            />
          </div>
        </div>
      </FormSection>

      <Separator />

      <FormSection
        title="표시 설정"
        description="관리 목록에서 보일 순서와 활성화 상태를 조정합니다."
      >
        <div className="grid gap-4 sm:grid-cols-[minmax(0,180px)_minmax(0,1fr)]">
          <div className="space-y-2">
            <label htmlFor="flower-sort-order" className="text-sm font-medium text-foreground">
              정렬 순서
            </label>
            <Input id="flower-sort-order" name="sort_order" type="number" defaultValue={defaultValue?.sort_order ?? 0} />
          </div>
          <label
            htmlFor="flower-is-active"
            className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground"
          >
            <input
              id="flower-is-active"
              name="is_active"
              type="checkbox"
              defaultChecked={defaultValue?.is_active ?? true}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
            />
            활성화
          </label>
        </div>
      </FormSection>

      {errorMessage ? <p role="alert">{errorMessage}</p> : null}
      {successMessage ? <p className="text-sm text-foreground">{successMessage}</p> : null}
      <div className="flex justify-end">
        <Button type="submit">꽃 저장</Button>
      </div>
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
