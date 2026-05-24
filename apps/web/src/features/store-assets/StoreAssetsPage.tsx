'use client';

import React, { useCallback, useRef, useState } from 'react';

import { DashboardShell } from '@/features/dashboard/DashboardShell';

import { DESIGN_SIZE, type Platform } from './designTokens';
import { PanelCanvas } from './PanelCanvas';
import { PanelCard } from './PanelCard';
import { PANELS } from './panels';
import { PlatformToggle } from './PlatformToggle';
import { captureNodeToPng } from './exportPng';
import { downloadAsZip, formatDateYYYYMMDD, type ZipEntry } from './exportZip';

function nodeKey(platform: Platform, slug: string): string {
  return `${platform}-${slug}`;
}

export function StoreAssetsPage() {
  const [platform, setPlatform] = useState<Platform>('ios');
  const [screenshots, setScreenshots] = useState<Record<string, string | null>>({});
  const [zipBusy, setZipBusy] = useState(false);
  const [downloadingSlug, setDownloadingSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 14개 추출 노드를 부모가 단일 소스로 보유.
  const nodesRef = useRef<Record<string, HTMLDivElement | null>>({});

  const handleDownloadSingle = useCallback(
    async (slug: string) => {
      const panel = PANELS.find((p) => p.slug === slug);
      if (!panel) throw new Error(`알 수 없는 패널: ${slug}`);
      const node = nodesRef.current[nodeKey(platform, slug)];
      if (!node) throw new Error(`추출 노드 누락: ${nodeKey(platform, slug)}`);
      const { width, height } = DESIGN_SIZE[platform];
      setDownloadingSlug(slug);
      setError(null);
      try {
        const blob = await captureNodeToPng(node, width, height);
        const { saveAs } = await import('file-saver');
        saveAs(blob, `${platform}-${panel.index}-${panel.slug}.png`);
      } finally {
        setDownloadingSlug(null);
      }
    },
    [platform],
  );

  async function handleDownloadAll() {
    setZipBusy(true);
    setError(null);
    try {
      const entries: ZipEntry[] = [];
      for (const p of ['ios', 'android'] as Platform[]) {
        const { width, height } = DESIGN_SIZE[p];
        for (const panel of PANELS) {
          const node = nodesRef.current[nodeKey(p, panel.slug)];
          if (!node) throw new Error(`추출 노드 누락: ${nodeKey(p, panel.slug)}`);
          const blob = await captureNodeToPng(node, width, height);
          entries.push({
            platform: p,
            filename: `${p}-${panel.index}-${panel.slug}.png`,
            blob,
          });
        }
      }
      await downloadAsZip(entries, formatDateYYYYMMDD(new Date()));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ZIP 생성 실패');
    } finally {
      setZipBusy(false);
    }
  }

  return (
    <DashboardShell
      title="스토어 스크린샷"
      description="앱스토어/플레이스토어 마케팅 스크린샷을 패널별로 또는 일괄로 다운로드합니다."
      actions={
        <div className="flex items-center gap-3">
          <PlatformToggle value={platform} onChange={setPlatform} />
          <button
            type="button"
            onClick={handleDownloadAll}
            disabled={zipBusy}
            aria-busy={zipBusy}
            className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background disabled:opacity-50"
          >
            {zipBusy ? 'ZIP 생성 중…' : '전체 ZIP 다운로드'}
          </button>
        </div>
      }
    >
      {error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {PANELS.map((panel) => (
          <PanelCard
            key={panel.slug}
            panel={panel}
            platform={platform}
            screenshotDataUrl={screenshots[panel.slug] ?? null}
            onScreenshotChange={(next) =>
              setScreenshots((prev) => ({ ...prev, [panel.slug]: next }))
            }
            onDownload={handleDownloadSingle}
            isDownloading={downloadingSlug === panel.slug}
          />
        ))}
      </div>

      {/* 14개 추출 노드 (iOS×7 + Android×7). 단건/ZIP 다운로드 모두 이 노드에서 캡처. */}
      <div
        style={{ position: 'fixed', left: '-99999px', top: 0, pointerEvents: 'none' }}
        aria-hidden
      >
        {(['ios', 'android'] as Platform[]).map((p) =>
          PANELS.map((panel) => {
            const key = nodeKey(p, panel.slug);
            return (
              <div
                key={key}
                ref={(el) => {
                  nodesRef.current[key] = el;
                }}
              >
                <PanelCanvas
                  panel={panel}
                  platform={p}
                  screenshotDataUrl={screenshots[panel.slug] ?? null}
                />
              </div>
            );
          }),
        )}
      </div>
    </DashboardShell>
  );
}
