import { supabase } from '../lib/supabase';
import type { FlowerSpot, SpotBlog, SpotVideo } from './types';
import { toFlowerSpot } from './spotMappers';

export const spotKeys = {
  all: ['spots'] as const,
  detail: (slug: string) => ['spots', slug] as const,
  top: (n: number) => ['spots', 'top', n] as const,
  content: (slug: string) => ['spots', 'content', slug] as const,
};

export function toRegionSummary(regionSecondary: string) {
  const primaryRegion = regionSecondary.split(' ')[0];

  return primaryRegion ?? regionSecondary;
}

export async function getPublishedSpots(): Promise<FlowerSpot[]> {
  const { data, error } = await supabase
    .from('spots')
    .select('*, flower:flowers(name_ko, thumbnail_url, is_active)')
    .eq('status', 'published')
    .order('display_order', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => toFlowerSpot(row as any));
}

export async function getPublishedSpotBySlug(slug: string): Promise<FlowerSpot | undefined> {
  const { data, error } = await supabase
    .from('spots')
    .select('*, flower:flowers(name_ko, thumbnail_url, is_active)')
    .eq('status', 'published')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;

  return data ? toFlowerSpot(data as any) : undefined;
}

export async function getTopSpots(n: number): Promise<FlowerSpot[]> {
  const { data, error } = await supabase
    .from('spots')
    .select('*, flower:flowers(name_ko, thumbnail_url, is_active)')
    .eq('status', 'published')
    .not('now_score', 'is', null)
    .order('now_score', { ascending: false, nullsFirst: false })
    .limit(n);

  if (error) throw error;

  return (data ?? []).map((row) => toFlowerSpot(row as any));
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
      .limit(3),
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
    .slice(0, 3)
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
