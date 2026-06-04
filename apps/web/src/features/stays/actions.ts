'use server';

import { revalidatePath } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';

import { bulkUpdateStayStatus, updateStayTripcomUrl, updateStayThumbnail } from '@/lib/data/stays';
import type { Database, StayStatus } from '@/lib/types';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { httpsOnlyUrlSchema } from './staySchema';

export async function bulkUpdateStayStatusAction(ids: string[], status: StayStatus): Promise<void> {
  if (ids.length === 0) return;

  const supabase = await createServerSupabaseClient();
  const client = supabase as unknown as SupabaseClient<Database>;

  await bulkUpdateStayStatus(client, ids, status);

  revalidatePath('/admin/stays');
}

/**
 * 호텔 대표 사진(thumbnail_url) 업데이트.
 * 빈 문자열은 null로 정규화 — 사용자가 이미지를 제거한 경우 NULL 저장.
 */
export async function updateStayThumbnailAction(id: string, thumbnailUrl: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const client = supabase as unknown as SupabaseClient<Database>;

  const normalized = thumbnailUrl.trim().length > 0 ? thumbnailUrl.trim() : null;

  // http(s) 스킴만 허용 — XSS 방어. ImageUploader 업로드 URL은 항상 https.
  if (normalized != null && !/^https?:\/\//i.test(normalized)) {
    throw new Error('thumbnail_url은 http(s) 스킴만 허용됩니다');
  }

  await updateStayThumbnail(client, id, normalized);

  revalidatePath('/admin/stays');
  revalidatePath(`/admin/stays/${id}`);
}

/**
 * 호텔 trip.com 예약 URL 업데이트.
 * 입력은 전체 URL 또는 빈 문자열(→ null, 검색 fallback).
 * http(s) 스킴만 허용 — XSS 방어. 비-http(s)면 Error throw(폼이 메시지 표시).
 */
export async function updateStayTripcomUrlAction(id: string, rawUrl: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const client = supabase as unknown as SupabaseClient<Database>;

  const trimmed = rawUrl.trim();
  let url: string | null = null;
  if (trimmed.length > 0) {
    const parsed = httpsOnlyUrlSchema.safeParse(trimmed);
    if (!parsed.success) {
      throw new Error('예약 URL은 http(s)로 시작하는 올바른 전체 URL이어야 합니다.');
    }
    url = parsed.data;
  }

  await updateStayTripcomUrl(client, id, url);

  revalidatePath('/admin/stays');
  revalidatePath(`/admin/stays/${id}`);
}
