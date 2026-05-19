'use server';

import { revalidatePath } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';

import { bulkUpdateStayStatus, updateStayThumbnail } from '@/lib/data/stays';
import type { Database, StayStatus } from '@/lib/types';
import { createServerSupabaseClient } from '@/lib/supabase/server';

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
