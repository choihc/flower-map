'use client';

import React from 'react';
import { useState } from 'react';

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
};

export function ImportConsole({ existingSpotSlugs = [], onValidate }: ImportConsoleProps) {
  const [value, setValue] = useState('');
  const [summary, setSummary] = useState<ValidationSummary | null>(null);

  async function handleValidate() {
    const next = await (onValidate?.(value) ?? validateImportPayload(value, existingSpotSlugs));
    setSummary(next);
  }

  return (
    <section>
      <label htmlFor="import-json">JSON 입력</label>
      <textarea id="import-json" value={value} onChange={(event) => setValue(event.target.value)} />
      <button onClick={handleValidate} type="button">
        검증
      </button>
      {summary ? (
        <div>
          <p>신규 {summary.created}건</p>
          <p>업데이트 {summary.updated}건</p>
          {summary.errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      ) : null}
    </section>
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
