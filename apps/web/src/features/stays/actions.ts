'use server';

import { revalidatePath } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';

import { bulkUpdateStayStatus, updateStayAgodaHotelId, updateStayThumbnail } from '@/lib/data/stays';
import { parseAgodaHotelId } from './agodaHidParser';
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

/**
 * 호텔 Agoda hotel id(hid) 업데이트.
 * 입력은 다음 중 하나:
 * - Agoda Partner Search 결과 URL (예: https://www.agoda.com/partners/partnersearch.aspx?...hid=24180119)
 * - hid 숫자만 (예: "24180119")
 * - 빈 문자열 → null로 정규화 (hid 제거)
 *
 * 유효하지 않은 입력이면 Error throw — 폼이 에러 메시지 표시.
 */
export async function updateStayAgodaHotelIdAction(id: string, rawInput: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const client = supabase as unknown as SupabaseClient<Database>;

  const trimmed = rawInput.trim();
  let hid: string | null = null;
  if (trimmed.length > 0) {
    const parsed = parseAgodaHotelId(trimmed);
    if (parsed == null) {
      throw new Error('Agoda 호텔 ID를 인식할 수 없습니다. Agoda Partner Search 결과 URL 또는 hid 숫자만 입력하세요.');
    }
    hid = parsed;
  }

  await updateStayAgodaHotelId(client, id, hid);

  revalidatePath('/admin/stays');
  revalidatePath(`/admin/stays/${id}`);
}
