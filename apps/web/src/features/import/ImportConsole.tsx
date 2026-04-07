'use client';

import React from 'react';
import { useState, useTransition } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

import { classifyImport } from './classifyImport';
import { importPayloadSchema } from './importSchema';

export type ValidationSummary = {
  created: number;
  updated: number;
  errors: string[];
};

type ImportConsoleProps = {
  existingSpotSlugs?: string[];
  onValidate?: (payload: string) => Promise<ValidationSummary>;
  importAction?: (payload: string) => Promise<ValidationSummary>;
};

export function ImportConsole({ existingSpotSlugs = [], onValidate, importAction }: ImportConsoleProps) {
  const [value, setValue] = useState('');
  const [validationSummary, setValidationSummary] = useState<ValidationSummary | null>(null);
  const [saveSummary, setSaveSummary] = useState<ValidationSummary | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleValidate() {
    setSaveSummary(null);
    const next = await (onValidate?.(value) ?? validateImportPayload(value, existingSpotSlugs));
    setValidationSummary(next);
  }

  function handleImport() {
    startTransition(async () => {
      const next =
        (await importAction?.(value)) ??
        ({
          created: 0,
          updated: 0,
          errors: ['저장 기능이 아직 연결되지 않았습니다.'],
        } satisfies ValidationSummary);

      setSaveSummary(next);
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,360px)]">
      <Card className="overflow-hidden">
        <CardHeader className="px-6 py-6">
          <CardTitle>JSON 편집기</CardTitle>
          <CardDescription>명소 또는 꽃 JSON payload를 붙여 넣고 먼저 검증한 뒤 draft로 저장합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-6 pb-6">
          <div className="space-y-2">
            <label htmlFor="import-json" className="text-sm font-medium text-foreground">
              JSON 입력
            </label>
            <Textarea
              id="import-json"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              className="min-h-[420px] font-mono text-[13px] leading-6"
              placeholder='{"spots":[...]}'
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" onClick={handleValidate}>
              검증
            </Button>
            <Button type="button" disabled={isPending} onClick={handleImport}>
              draft 저장
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            한 번에 하나의 payload만 다루며, 중복 slug와 스키마 오류는 오른쪽 패널에 즉시 요약됩니다.
          </p>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="px-6 py-6">
          <CardTitle>결과 요약</CardTitle>
          <CardDescription>검증과 저장 결과를 한곳에서 확인합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 px-6 pb-6">
          <div className="grid gap-3">
            <SummaryRow label="검증 신규" value={validationSummary?.created ?? 0} />
            <SummaryRow label="검증 업데이트" value={validationSummary?.updated ?? 0} />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">검증 오류</p>
            <Separator />
            <div className="space-y-2">
              {validationSummary?.errors.length ? (
                validationSummary.errors.map((error) => (
                  <p key={error} className="rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground">
                    {error}
                  </p>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">검증 오류가 없습니다.</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">저장 결과</p>
            <Separator />
            {saveSummary ? (
              <div className="space-y-2">
                {saveSummary.errors.length === 0 ? (
                  <p className="rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground">
                    저장 완료: 신규 {saveSummary.created}건, 업데이트 {saveSummary.updated}건
                  </p>
                ) : null}
                {saveSummary.errors.map((error) => (
                  <p key={error} role="alert" className="rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground">
                    {error}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">저장 전입니다.</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">draft 저장</Badge>
            <Badge variant="secondary">검증 결과</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-3">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

async function validateImportPayload(payload: string, existingSpotSlugs: string[]): Promise<ValidationSummary> {
  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(payload);
  } catch {
    return {
      created: 0,
      updated: 0,
      errors: ['유효한 JSON을 입력해 주세요.'],
    };
  }

  const parsed = importPayloadSchema.safeParse(parsedJson);

  if (!parsed.success) {
    return {
      created: 0,
      updated: 0,
      errors: parsed.error.issues.map((issue) => issue.message),
    };
  }

  const existingRows = existingSpotSlugs.map((slug) => ({ slug }));

  if ('spot' in parsed.data) {
    const classified = classifyImport([parsed.data.spot], existingRows);

    return {
      created: classified.toCreate.length,
      updated: classified.toUpdate.length,
      errors: classified.duplicates.map((duplicate) => `${duplicate.slug} slug is duplicated in the import payload`),
    };
  }

  const classified = classifyImport(parsed.data.spots, existingRows);

  return {
    created: classified.toCreate.length,
    updated: classified.toUpdate.length,
    errors: classified.duplicates.map((duplicate) => `${duplicate.slug} slug is duplicated in the import payload`),
  };
}
