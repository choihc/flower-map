import { supabase } from '../lib/supabase';
import type { FlowerSpot, SpotBlog, SpotVideo } from './types';
import { boostFirst, kstToday } from './boost';
import { toFlowerSpot } from './spotMappers';

export const spotKeys = {
  all: ['spots'] as const,
  detail: (slug: string) => ['spots', slug] as const,
  top: (n: number) => ['spots', 'top', n] as const,
  topBoosted: (n: number) => ['spots', 'top-boosted', n] as const,
  content: (slug: string) => ['spots', 'content', slug] as const,
};

/** boost 컬럼을 포함한 공통 명소 select 문자열 (B-1, NFR-3) */
const SPOT_SELECT = '*, flower:flowers(name_ko, thumbnail_url, is_active, boost_start_at, boost_end_at)';

export function toRegionSummary(regionSecondary: string) {
  const primaryRegion = regionSecondary.split(' ')[0];

  return primaryRegion ?? regionSecondary;
}

export async function getPublishedSpots(): Promise<FlowerSpot[]> {
  const { data, error } = await supabase
    .from('spots')
    .select(SPOT_SELECT)
    .eq('status', 'published')
    .order('display_order', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => toFlowerSpot(row as any));
}

export async function getPublishedSpotBySlug(slug: string): Promise<FlowerSpot | undefined> {
  const { data, error } = await supabase
    .from('spots')
    .select(SPOT_SELECT)
    .eq('status', 'published')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;

  return data ? toFlowerSpot(data as any) : undefined;
}

export async function getTopSpots(n: number): Promise<FlowerSpot[]> {
  const { data, error } = await supabase
    .from('spots')
    .select(SPOT_SELECT)
    .eq('status', 'published')
    .not('now_score', 'is', null)
    .order('now_score', { ascending: false, nullsFirst: false })
    .limit(n);

  if (error) throw error;

  return (data ?? []).map((row) => toFlowerSpot(row as any));
}

/**
 * 활성 부스트 꽃에 속한 published 명소를 now_score desc 순으로 반환한다. (B-4)
 *
 * 2-step 조회: ① flowers에서 활성 부스트 꽃 id를 조회하고
 * ② spots를 flower_id IN (...)으로 필터한다.
 * PostgREST 임베디드 리소스 필터(`flower.col`)는 `!inner` 없이는 부모 행을 거르지
 * 않아 비부스트 명소가 혼입되고 flower:null 행이 들어올 수 있으므로, 그 불확실성을
 * 제거하기 위해 2-step을 사용한다(NFR-3: 보조 쿼리 1회 허용).
 */
export async function getActiveBoostedSpots(now = new Date(), limit?: number): Promise<FlowerSpot[]> {
  const today = kstToday(now);

  // ① 활성 부스트 꽃 id 조회 (§3.2: 두 날짜 모두 not null AND start<=today<=end)
  const { data: flowers, error: flowerError } = await supabase
    .from('flowers')
    .select('id')
    .not('boost_start_at', 'is', null)
    .not('boost_end_at', 'is', null)
    .lte('boost_start_at', today)
    .gte('boost_end_at', today);

  if (flowerError) throw flowerError;

  const flowerIds = (flowers ?? []).map((f) => (f as { id: string }).id);
  if (flowerIds.length === 0) return [];

  // ② 해당 꽃의 published 명소 (now_score desc)
  //    홈 TOP은 어차피 상위 n개만 노출하므로 limit가 주어지면 페이로드를 줄인다.
  let query = supabase
    .from('spots')
    .select(SPOT_SELECT)
    .eq('status', 'published')
    .in('flower_id', flowerIds)
    .order('now_score', { ascending: false, nullsFirst: false });

  if (limit != null) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data ?? [])
    .filter((row) => (row as { flower: unknown }).flower != null)
    .map((row) => toFlowerSpot(row as any, now));
}

/**
 * 홈 TOP 부스트 조회 (FR-5-1)
 * - 활성 부스트 꽃의 공개 명소가 limit n에 의해 누락되지 않도록 보장
 * - 병합 후 boostFirst(now_score desc) 정렬, slice(0, n)
 * ⚠️ getTopSpots(n) 동작 불변 — HocanceTop5Section은 getTopSpots를 그대로 사용
 */
export async function getTopSpotsWithBoost(n: number, now = new Date()): Promise<FlowerSpot[]> {
  const [top, boosted] = await Promise.all([getTopSpots(n), getActiveBoostedSpots(now, n)]);

  // 부스트 명소를 앞에 두고 top 결과를 뒤에 이어서 중복 제거
  const seen = new Set<string>();
  const merged: FlowerSpot[] = [];
  for (const spot of [...boosted, ...top]) {
    if (!seen.has(spot.id)) {
      seen.add(spot.id);
      merged.push(spot);
    }
  }

  const byNowScore = (a: FlowerSpot, b: FlowerSpot) =>
    (b.nowScore ?? -1) - (a.nowScore ?? -1);

  return merged.sort(boostFirst(byNowScore)).slice(0, n);
}

type SpotVideoRow = {
  video_id: string;
  title: string;
  channel_title: string | null;
  thumbnail_url: string | null;
  published_at: string | null;
};

type SpotBlogRow = {
  url: string;
  title: string;
  blogger_name: string | null;
  posted_at: string | null;
};

export async function getSpotContent(
  slug: string,
): Promise<{ videos: SpotVideo[]; blogs: SpotBlog[] }> {
  const { data: spotRow, error: spotError } = await supabase
    .from('spots')
    .select('id')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (spotError) throw spotError;
  if (!spotRow) return { videos: [], blogs: [] };

  const spotId = (spotRow as { id: string }).id;

  const [videoRes, blogRes] = await Promise.all([
    supabase
      .from('spot_videos')
      .select('video_id, title, channel_title, thumbnail_url, published_at')
      .eq('spot_id', spotId)
      .order('relevance_score', { ascending: false, nullsFirst: false })
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(6),
    supabase
      .from('spot_blogs')
      .select('url, title, blogger_name, posted_at')
      .eq('spot_id', spotId)
      .order('relevance_score', { ascending: false, nullsFirst: false })
      .order('posted_at', { ascending: false, nullsFirst: false })
      .limit(5),
  ]);

  if (videoRes.error) throw videoRes.error;
  if (blogRes.error) throw blogRes.error;

  // 날짜가 없는 row는 품질이 낮은 데이터로 간주해 결과에서 제외한다.
  const videos: SpotVideo[] = ((videoRes.data ?? []) as SpotVideoRow[])
    .filter((row) => row.published_at != null)
    .slice(0, 6)
    .map((row) => ({
      videoId: row.video_id,
      title: row.title,
      channelTitle: row.channel_title ?? '',
      thumbnailUrl: row.thumbnail_url ?? '',
      publishedAt: new Date(row.published_at as string),
    }));

  const blogs: SpotBlog[] = ((blogRes.data ?? []) as SpotBlogRow[])
    .filter((row) => row.posted_at != null)
    .slice(0, 5)
    .map((row) => ({
      url: row.url,
      title: row.title,
      bloggerName: row.blogger_name ?? '',
      postedAt: new Date(row.posted_at as string),
    }));

  return { videos, blogs };
}

function bloomProximityScore(spot: FlowerSpot, today: Date): number {
  const todayMs = today.getTime();
  const startMs = new Date(`${spot.bloomStartAt}T00:00:00`).getTime();
  const endMs = new Date(`${spot.bloomEndAt}T00:00:00`).getTime();

  if (todayMs >= startMs && todayMs <= endMs) {
    // 현재 개화 중: 종료일까지 남은 일수 (0~N, 작을수록 임박)
    return Math.floor((endMs - todayMs) / (1000 * 60 * 60 * 24));
  }

  if (todayMs < startMs) {
    // 아직 개화 전: 1000 + 개화까지 남은 일수
    return 1000 + Math.floor((startMs - todayMs) / (1000 * 60 * 60 * 24));
  }

  // 개화 종료: 우선순위 최하위
  return 99999;
}

export function deriveFlowerLabels(spots: FlowerSpot[]): string[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const bestScoreByFlower = new Map<string, number>();
  for (const spot of spots) {
    if (!spot.flowerIsActive) continue;
    const score = bloomProximityScore(spot, today);
    const existing = bestScoreByFlower.get(spot.flower);
    if (existing === undefined || score < existing) {
      bestScoreByFlower.set(spot.flower, score);
    }
  }

  return [...bestScoreByFlower.entries()]
    .sort((a, b) => a[1] - b[1])
    .map(([flower]) => flower);
}

export function deriveRegionSummaries(spots: FlowerSpot[]): string[] {
  return [...new Set(spots.map((s) => toRegionSummary(s.location)))];
}
