'use server';

import { revalidatePath } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';

import { createFlower } from '@/lib/data/flowers';
import { createSpot, updateSpot } from '@/lib/data/spots';
import { replaceSpotPhotos } from '@/lib/data/spotPhotos';
import type { Database, FlowerRow, SpotRow } from '@/lib/types';
import { createServerSupabaseClient } from '@/lib/supabase/server';

import type { ValidationSummary } from './ImportConsole';
import { importPayloadSchema } from './importSchema';
import { planImportWrite } from './planImportWrite';

export async function saveImportPayloadAction(payload: string): Promise<ValidationSummary> {
  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(payload);
  } catch {
    return { created: 0, updated: 0, errors: ['유효한 JSON을 입력해 주세요.'] };
  }

  const parsed = importPayloadSchema.safeParse(parsedJson);

  if (!parsed.success) {
    console.error('[import] Zod validation failed:', JSON.stringify(parsed.error.issues, null, 2));
    return {
      created: 0,
      updated: 0,
      errors: parsed.error.issues.map((issue) => `[${issue.path.join('.')}] ${issue.message}`),
    };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const writeClient = supabase as unknown as SupabaseClient<Database>;
    const flowerId = await resolveFlowerId(supabase, parsed.data);
    const incomingSpots = 'spot' in parsed.data ? [parsed.data.spot] : parsed.data.spots;
    const incomingSlugs = incomingSpots.map((spot) => spot.slug);
    const existingSpots = await listSpotIdentitiesBySlugs(supabase, incomingSlugs);
    const plan = planImportWrite(parsed.data, { flowerId, existingSpots });

    if (plan.errors.length > 0) {
      return { created: 0, updated: 0, errors: plan.errors };
    }

    // slug → photos 맵 구성
    const photosMap = new Map<string, Array<{ url: string; sort_order: number; caption?: string | null }>>();
    for (const spot of incomingSpots) {
      photosMap.set(
        spot.slug,
        (spot.photos ?? []).map((p) => ({
          url: p.url,
          sort_order: p.sort_order ?? 0,
          caption: p.caption ?? null,
        })),
      );
    }

    for (const spot of plan.toCreate) {
      const created = await createSpot(writeClient, spot);
      const photos = photosMap.get(spot.slug) ?? [];
      await replaceSpotPhotos(writeClient, created.id, photos);
    }

    for (const spot of plan.toUpdate) {
      await updateSpot(writeClient, spot.id, spot.input);
      const photos = photosMap.get(spot.slug) ?? [];
      await replaceSpotPhotos(writeClient, spot.id, photos);
    }

    revalidatePath('/admin/flowers');
    revalidatePath('/admin/spots');
    revalidatePath('/admin/spots/import');

    return { created: plan.toCreate.length, updated: plan.toUpdate.length, errors: [] };
  } catch (error) {
    console.error('[import] Unexpected error during save:', error);
    return { created: 0, updated: 0, errors: [getErrorMessage(error)] };
  }
}

async function resolveFlowerId(
  client: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  payload: Parameters<typeof planImportWrite>[0],
) {
  if ('spot' in payload) {
    const flower = await findFlowerBySlug(client, payload.flower_slug);
    if (flower == null) throw new Error(`등록된 꽃이 없습니다: ${payload.flower_slug}`);
    return flower.id;
  }
  const existingFlower = await findFlowerBySlug(client, payload.flower.slug);
  if (existingFlower != null) return existingFlower.id;
  const createdFlower = await createFlower(client as unknown as SupabaseClient<Database>, payload.flower);
  return createdFlower.id;
}

async function findFlowerBySlug(client: Awaited<ReturnType<typeof createServerSupabaseClient>>, slug: string) {
  const { data, error } = await ((client.from('flowers') as any).select('*').eq('slug', slug).maybeSingle() as Promise<{
    data: FlowerRow | null;
    error: Error | null;
  }>);
  if (error != null) throw error;
  return data;
}

async function listSpotIdentitiesBySlugs(
  client: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  slugs: string[],
) {
  if (slugs.length === 0) return [] as Array<Pick<SpotRow, 'id' | 'slug'>>;
  const { data, error } = await ((client.from('spots') as any).select('id, slug').in('slug', slugs) as Promise<{
    data: Array<Pick<SpotRow, 'id' | 'slug'>> | null;
    error: Error | null;
  }>);
  if (error != null) throw error;
  return data ?? [];
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return 'JSON 저장 중 오류가 발생했습니다.';
}
