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
  onValidate?: (payload: string) => Promise<ValidationSummary>;
};

export function ImportConsole({ onValidate = validateImportPayload }: ImportConsoleProps) {
  const [value, setValue] = useState('');
  const [summary, setSummary] = useState<ValidationSummary | null>(null);

  async function handleValidate() {
    const next = await onValidate(value);
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

async function validateImportPayload(payload: string): Promise<ValidationSummary> {
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

  if ('spot' in parsed.data) {
    return {
      created: 1,
      updated: 0,
      errors: [],
    };
  }

  const classified = classifyImport(parsed.data.spots, []);

  return {
    created: classified.toCreate.length,
    updated: classified.toUpdate.length,
    errors: classified.duplicates.map((duplicate) => `${duplicate.slug} slug is duplicated in the import payload`),
  };
}
