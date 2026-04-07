'use client';

import React, { useRef, useState } from 'react';

import type { UploadImageResult } from '@/lib/blob/uploadImage';

type ImageUploaderProps = {
  defaultUrl?: string | null;
};

export function ImageUploader({ defaultUrl }: ImageUploaderProps) {
  const [url, setUrl] = useState<string>(defaultUrl ?? '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });

      if (!res.ok) {
        setError('업로드에 실패했습니다. 다시 시도해 주세요.');
        return;
      }

      const result: UploadImageResult = await res.json();

      if (!result.success) {
        setError(result.error.message);
        return;
      }

      setUrl(result.data.url);
    } catch {
      setError('네트워크 오류가 발생했습니다. 연결을 확인해 주세요.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name="thumbnail_url" value={url} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {url ? (
        <div className="relative w-full overflow-hidden rounded-xl border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="썸네일 미리보기" className="h-40 w-full object-cover" />
          <div className="absolute inset-0 flex items-end justify-end p-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-foreground shadow"
            >
              다시 선택
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 py-8 text-sm font-medium text-muted-foreground hover:bg-muted/60"
        >
          이미지 선택
        </button>
      )}

      {uploading && (
        <p className="text-xs text-muted-foreground">업로드 중...</p>
      )}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
