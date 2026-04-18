import { NextResponse } from 'next/server';

import { verifyCronAuth } from '@/lib/cron/auth';
import { shardIndex, todayShard } from '@/lib/cron/shard';
import {
  filterBlogs,
  filterVideos,
  type BlogItem,
  type SpotContext,
  type VideoItem,
} from '@/lib/content-hub/filters';
import { getExternalApiEnv } from '@/lib/env';
import {
  searchBlogs,
  type BlogItem as NaverBlogItem,
} from '@/lib/external/naverSearch';
import { getVideoStats, searchYouTube } from '@/lib/external/youtube';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import type { SpotBlogInsert, SpotVideoInsert } from '@/lib/types';

export const maxDuration = 300;

const LOOKBACK_DAYS = 180;
const DAY_MS = 86400000;
const YOUTUBE_SEARCH_RESULTS = 20;
const BLOG_SEARCH_DISPLAY = 20;
const YOUTUBE_STATS_BATCH_SIZE = 50;

interface SpotRecord {
  id: string;
  name: string;
  exclude_keywords: string[] | null;
  flowers: { name_ko: string; aliases: string[] | null };
}

function mapBlogToFilterItem(raw: NaverBlogItem): BlogItem {
  return {
    url: raw.link,
    title: raw.title,
    description: raw.description,
    bloggerName: raw.bloggerName,
    postedAt: raw.postedAt,
  };
}

async function collectVideoStats(
  apiKey: string,
  videoIds: string[],
): Promise<Map<string, number>> {
  const merged = new Map<string, number>();
  if (videoIds.length === 0) return merged;

  for (let i = 0; i < videoIds.length; i += YOUTUBE_STATS_BATCH_SIZE) {
    const slice = videoIds.slice(i, i + YOUTUBE_STATS_BATCH_SIZE);
    const partial = await getVideoStats({ apiKey, videoIds: slice });
    for (const [id, count] of partial.entries()) {
      merged.set(id, count);
    }
  }
  return merged;
}

export async function GET(req: Request) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const supabase = createAdminSupabaseClient();
  const env = getExternalApiEnv();
  const shard = todayShard();

  const { data: spotsData, error } = await supabase
    .from('spots')
    .select(
      'id, name, exclude_keywords, flowers!inner(name_ko, aliases)',
    )
    .eq('status', 'published');

  if (error) {
    console.error('content-sync spots query failed', error);
    return NextResponse.json(
      { error: 'spots_query_failed' },
      { status: 500 },
    );
  }

  const allSpots = (spotsData ?? []) as unknown as SpotRecord[];
  const spotsToday = allSpots.filter((s) => shardIndex(s.id) === shard);

  let processed = 0;
  for (const spot of spotsToday) {
    try {
      const spotContext: SpotContext = {
        name: spot.name,
        flower: spot.flowers.name_ko,
        aliases: spot.flowers.aliases ?? [],
        excludeKeywords: spot.exclude_keywords ?? [],
      };
      const query = `${spot.name} ${spot.flowers.name_ko}`.trim();
      const publishedAfter = new Date(Date.now() - LOOKBACK_DAYS * DAY_MS);

      const rawVideos = await searchYouTube({
        apiKey: env.youtubeApiKey,
        query,
        publishedAfter,
        maxResults: YOUTUBE_SEARCH_RESULTS,
      });
      const stats = await collectVideoStats(
        env.youtubeApiKey,
        rawVideos.map((v) => v.videoId),
      );
      const videosWithStats: VideoItem[] = rawVideos.map((v) => ({
        ...v,
        viewCount: stats.get(v.videoId) ?? 0,
      }));
      const filteredVideos = filterVideos(videosWithStats, spotContext);

      const [blogsBySim, blogsByDate] = await Promise.all([
        searchBlogs({
          clientId: env.naverClientId,
          clientSecret: env.naverClientSecret,
          query,
          sort: 'sim',
          display: BLOG_SEARCH_DISPLAY,
        }),
        searchBlogs({
          clientId: env.naverClientId,
          clientSecret: env.naverClientSecret,
          query,
          sort: 'date',
          display: BLOG_SEARCH_DISPLAY,
        }),
      ]);
      const dedupedByUrl = new Map<string, NaverBlogItem>();
      for (const b of [...blogsBySim, ...blogsByDate]) {
        if (!dedupedByUrl.has(b.link)) dedupedByUrl.set(b.link, b);
      }
      const filteredBlogs = filterBlogs(
        Array.from(dedupedByUrl.values()).map(mapBlogToFilterItem),
        spotContext,
      );

      const { error: deleteVideoError } = await supabase
        .from('spot_videos')
        .delete()
        .eq('spot_id', spot.id);
      if (deleteVideoError) {
        console.error(
          'content-sync delete videos failed',
          spot.id,
          deleteVideoError,
        );
        continue;
      }

      if (filteredVideos.length > 0) {
        const videoRows: SpotVideoInsert[] = filteredVideos.map((v) => ({
          spot_id: spot.id,
          video_id: v.videoId,
          title: v.title,
          channel_title: v.channelTitle,
          thumbnail_url: v.thumbnailUrl,
          published_at: v.publishedAt.toISOString(),
          view_count: v.viewCount,
          relevance_score: v.relevanceScore ?? null,
        }));
        const { error: insertVideoError } = await (
          supabase.from('spot_videos') as unknown as {
            insert: (
              values: SpotVideoInsert[],
            ) => Promise<{ error: unknown }>;
          }
        ).insert(videoRows);
        if (insertVideoError) {
          console.error(
            'content-sync insert videos failed',
            spot.id,
            insertVideoError,
          );
          continue;
        }
      }

      const { error: deleteBlogError } = await supabase
        .from('spot_blogs')
        .delete()
        .eq('spot_id', spot.id);
      if (deleteBlogError) {
        console.error(
          'content-sync delete blogs failed',
          spot.id,
          deleteBlogError,
        );
        continue;
      }

      if (filteredBlogs.length > 0) {
        const blogRows: SpotBlogInsert[] = filteredBlogs.map((b) => ({
          spot_id: spot.id,
          url: b.url,
          title: b.title,
          description: b.description,
          blogger_name: b.bloggerName,
          posted_at: b.postedAt.toISOString(),
          relevance_score: b.relevanceScore ?? null,
        }));
        const { error: insertBlogError } = await (
          supabase.from('spot_blogs') as unknown as {
            insert: (
              values: SpotBlogInsert[],
            ) => Promise<{ error: unknown }>;
          }
        ).insert(blogRows);
        if (insertBlogError) {
          console.error(
            'content-sync insert blogs failed',
            spot.id,
            insertBlogError,
          );
          continue;
        }
      }

      processed++;
    } catch (err) {
      console.error('content-sync spot failed', spot.id, err);
    }
  }

  return NextResponse.json({
    ok: true,
    shard,
    processed,
    totalCandidates: spotsToday.length,
  });
}
