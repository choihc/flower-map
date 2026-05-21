'use client';

import React, { useId, useState } from 'react';

import { DESIGN_SIZE, type Platform } from './designTokens';
import { PanelCanvas } from './PanelCanvas';
import type { PanelConfig } from './panels';
import { readImageFile } from './readImageFile';

type Props = {
  panel: PanelConfig;
  platform: Platform;
  screenshotDataUrl: string | null;
  onScreenshotChange: (next: string | null) => void;
  onDownload: (slug: string) => Promise<void>;
  isDownloading: boolean;
};

const PREVIEW_SCALE = 0.18;

export function PanelCard({
  panel,
  platform,
  screenshotDataUrl,
  onScreenshotChange,
  onDownload,
  isDownloading,
}: Props) {
  const inputId = useId();
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const { width, height } = DESIGN_SIZE[platform];

  async function handleFile(file: File) {
    setError(null);
    setWarning(null);
    try {
      const { dataUrl, warning: w } = await readImageFile(file);
      onScreenshotChange(dataUrl);
      if (w) setWarning(w);
    } catch (e) {
      setError(e instanceof Error ? e.message : '파일을 읽지 못했습니다.');
    }
  }

  async function handleDownloadClick() {
    setError(null);
    try {
      await onDownload(panel.slug);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'PNG 생성 실패');
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="text-sm font-semibold">
          {panel.index}. {panel.title.join(' ')}
        </div>
        {panel.isNew ? (
          <span className="inline-block rounded-full bg-[#FF7B9C] px-2 py-0.5 text-[10px] font-bold text-white">
            NEW
          </span>
        ) : null}
      </div>

      {/* 미리보기 (축소). 추출용 노드는 부모가 보유. */}
      <div
        aria-label={`${panel.slug} 미리보기`}
        style={{
          width: width * PREVIEW_SCALE,
          height: height * PREVIEW_SCALE,
          overflow: 'hidden',
          borderRadius: 12,
        }}
        className="border border-border self-center"
      >
        <div
          style={{
            width,
            height,
            transform: `scale(${PREVIEW_SCALE})`,
            transformOrigin: 'top left',
          }}
        >
          <PanelCanvas panel={panel} platform={platform} screenshotDataUrl={screenshotDataUrl} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id={inputId}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = '';
          }}
        />
        <label
          htmlFor={inputId}
          className="cursor-pointer rounded-full border border-border px-3 py-1.5 text-xs hover:bg-muted/20"
        >
          {screenshotDataUrl ? '교체' : '업로드'}
        </label>
        {screenshotDataUrl ? (
          <button
            type="button"
            onClick={() => onScreenshotChange(null)}
            className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/20"
          >
            제거
          </button>
        ) : null}
        <button
          type="button"
          onClick={handleDownloadClick}
          disabled={isDownloading}
          aria-busy={isDownloading}
          className="ml-auto rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-background disabled:opacity-50"
        >
          {isDownloading ? '생성 중…' : 'PNG 다운로드'}
        </button>
      </div>

      {warning ? <p className="text-xs text-amber-700">{warning}</p> : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
