import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database, StayInsert, StayRow, StayStatus, StayUpdate } from '@/lib/types';

type StayWriteDraft = Omit<StayInsert, 'id' | 'created_at' | 'updated_at'>;

function emptyToNull(value: string | null | undefined): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function numberToNull(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function buildStayWriteInput(input: StayWriteDraft): StayInsert {
  return {
    ...input,
    thumbnail_url: emptyToNull(input.thumbnail_url),
    booking_query_override: emptyToNull(input.booking_query_override),
    agoda_hotel_id: emptyToNull(input.agoda_hotel_id),
    season_window_start: emptyToNull(input.season_window_start),
    season_window_end: emptyToNull(input.season_window_end),
    naver_rating_score: numberToNull(input.naver_rating_score),
    naver_rating_url: emptyToNull(input.naver_rating_url),
    google_rating_score: numberToNull(input.google_rating_score),
    google_rating_url: emptyToNull(input.google_rating_url),
    rating_captured_at: emptyToNull(input.rating_captured_at),
    source_note: emptyToNull(input.source_note),
    season_tags: input.season_tags ?? [],
    recommendation_points: input.recommendation_points ?? [],
    status: input.status ?? 'draft',
    source_type: input.source_type ?? 'manual_json',
    is_featured: input.is_featured ?? false,
    display_order: input.display_order ?? 0,
  };
}

export async function listStays(client: SupabaseClient<Database>): Promise<StayRow[]> {
  const { data, error } = await (client.from('stays') as any)
    .select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error != null) throw error;
  return data as StayRow[];
}

export async function bulkUpdateStayStatus(
  client: SupabaseClient<Database>,
  ids: string[],
  status: StayStatus,
): Promise<StayRow[]> {
  if (ids.length === 0) return [];

  const { data, error } = await (client.from('stays') as any)
    .update({ status })
    .in('id', ids)
    .select();

  if (error != null) throw error;
  return data as StayRow[];
}

export async function findStayById(
  client: SupabaseClient<Database>,
  id: string,
): Promise<StayRow | null> {
  const { data, error } = await ((client.from('stays') as any)
    .select('*')
    .eq('id', id)
    .maybeSingle() as Promise<{ data: StayRow | null; error: Error | null }>);

  if (error != null) throw error;
  return data;
}

export async function updateStayThumbnail(
  client: SupabaseClient<Database>,
  id: string,
  thumbnailUrl: string | null,
): Promise<StayRow> {
  const { data, error } = await (client.from('stays') as any)
    .update({ thumbnail_url: thumbnailUrl })
    .eq('id', id)
    .select()
    .single();

  if (error != null) throw error;
  return data as StayRow;
}

/**
 * 호텔 Agoda 호텔 ID(hid) 업데이트. null이면 컬럼을 비움 (검색 fallback).
 */
export async function updateStayAgodaHotelId(
  client: SupabaseClient<Database>,
  id: string,
  agodaHotelId: string | null,
): Promise<void> {
  const update: StayUpdate = { agoda_hotel_id: agodaHotelId };
  const { error } = await (client.from('stays') as any).update(update).eq('id', id);
  if (error != null) throw error;
}

export async function findStayBySlug(
  client: SupabaseClient<Database>,
  slug: string,
): Promise<Pick<StayRow, 'id' | 'slug'> | null> {
  const { data, error } = await ((client.from('stays') as any)
    .select('id, slug')
    .eq('slug', slug)
    .maybeSingle() as Promise<{
    data: Pick<StayRow, 'id' | 'slug'> | null;
    error: Error | null;
  }>);

  if (error != null) throw error;
  return data;
}

export async function createStay(
  client: SupabaseClient<Database>,
  input: StayWriteDraft,
): Promise<StayRow> {
  const { data, error } = await (client.from('stays') as any)
    .insert(buildStayWriteInput(input))
    .select()
    .single();

  if (error != null) throw error;
  return data as StayRow;
}

export async function updateStay(
  client: SupabaseClient<Database>,
  id: string,
  input: StayUpdate,
): Promise<StayRow> {
  const normalized = buildStayWriteInput(input as StayWriteDraft);
  const { data, error } = await (client.from('stays') as any)
    .update(normalized)
    .eq('id', id)
    .select()
    .single();

  if (error != null) throw error;
  return data as StayRow;
}

/**
 * stay 단건을 slug 기준으로 atomic upsert 한다. 동시 요청 race로 unique violation
 * (코드 23505) 발생을 방지한다. 반환된 `created_at === updated_at` 여부로
 * 신규 INSERT vs UPDATE 판정.
 */
export async function upsertStayBySlug(
  client: SupabaseClient<Database>,
  input: StayWriteDraft,
): Promise<{ row: StayRow; isNew: boolean }> {
  const normalized = buildStayWriteInput(input);
  const { data, error } = await (client.from('stays') as any)
    .upsert(normalized, { onConflict: 'slug' })
    .select()
    .single();

  if (error != null) throw error;
  const row = data as StayRow;
  return { row, isNew: row.created_at === row.updated_at };
}
