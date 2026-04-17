import { NextResponse } from 'next/server';

import { verifyCronAuth } from '@/lib/cron/auth';
import { getExternalApiEnv } from '@/lib/env';
import { fetchShortForecast } from '@/lib/external/kma';
import {
  fetchSearchTrends,
  type TrendGroup,
  type TrendResult,
} from '@/lib/external/naverDatalab';
import { searchBlogs } from '@/lib/external/naverSearch';
import { searchYouTube } from '@/lib/external/youtube';
import { calcBloomScore } from '@/lib/now-score/bloom';
import { calcContentScore } from '@/lib/now-score/content';
import { calcNowScore } from '@/lib/now-score/aggregate';
import { calcTrendScore } from '@/lib/now-score/trend';
import { calcYoyScore } from '@/lib/now-score/yoy';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import type { SpotUpdate } from '@/lib/types';

export const maxDuration = 300;

const TREND_LOOKBACK_DAYS = 7;
const CONTENT_LOOKBACK_DAYS = 7;
const YOY_WINDOW_DAYS = 7;
const TREND_GROUP_BATCH_SIZE = 5;
const DAY_MS = 86400000;

interface SpotRecord {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  bloom_start_at: string | null;
  bloom_end_at: string | null;
  flower_id: string;
  flowers: { name_ko: string; aliases: string[] | null };
}

interface TrendKeywords {
  spotId: string;
  query: string;
  groupName: string;
}

function latLngToKmaGrid(
  lat: number,
  lng: number,
): { nx: number; ny: number } {
  const RE = 6371.00877;
  const GRID = 5.0;
  const SLAT1 = 30.0;
  const SLAT2 = 60.0;
  const OLON = 126.0;
  const OLAT = 38.0;
  const XO = 43;
  const YO = 136;
  const DEGRAD = Math.PI / 180.0;
  const re = RE / GRID;
  const slat1 = SLAT1 * DEGRAD;
  const slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD;
  const olat = OLAT * DEGRAD;
  let sn =
    Math.tan(Math.PI * 0.25 + slat2 * 0.5) /
    Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = (re * sf) / Math.pow(ro, sn);
  let ra = Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5);
  ra = (re * sf) / Math.pow(ra, sn);
  let theta = lng * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2.0 * Math.PI;
  if (theta < -Math.PI) theta += 2.0 * Math.PI;
  theta *= sn;
  const nx = Math.floor(ra * Math.sin(theta) + XO + 0.5);
  const ny = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);
  return { nx, ny };
}

function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

function formatDate(date: Date): string {
  const y = date.getUTCFullYear().toString().padStart(4, '0');
  const m = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const d = date.getUTCDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function buildSpotQuery(spot: SpotRecord): string {
  return `${spot.name} ${spot.flowers.name_ko}`.trim();
}

function buildTrendGroup(spot: SpotRecord): TrendGroup {
  const base = [spot.name, spot.flowers.name_ko];
  const aliases = spot.flowers.aliases ?? [];
  const keywords = Array.from(
    new Set(
      [...base, ...aliases].filter(
        (k): k is string => typeof k === 'string' && k.trim().length > 0,
      ),
    ),
  );
  return {
    groupName: spot.id,
    keywords: keywords.length > 0 ? keywords : [spot.name],
  };
}

function averageRatio(
  data: ReadonlyArray<{ period: string; ratio: number }>,
): number {
  if (data.length === 0) return 0;
  const sum = data.reduce((acc, d) => acc + d.ratio, 0);
  return sum / data.length;
}

async function collectTrendScores(
  spots: readonly SpotRecord[],
  env: { naverClientId: string; naverClientSecret: string },
  now: Date,
): Promise<Map<string, number | null>> {
  const scores = new Map<string, number | null>();
  if (spots.length === 0) return scores;

  const startDate = formatDate(
    new Date(now.getTime() - TREND_LOOKBACK_DAYS * DAY_MS),
  );
  const endDate = formatDate(now);

  const batches = chunk(spots, TREND_GROUP_BATCH_SIZE);

  for (const batch of batches) {
    const groups = batch.map(buildTrendGroup);
    try {
      const results: TrendResult[] = await fetchSearchTrends({
        clientId: env.naverClientId,
        clientSecret: env.naverClientSecret,
        startDate,
        endDate,
        groups,
      });
      const byName = new Map(results.map((r) => [r.groupName, r]));
      for (const spot of batch) {
        const r = byName.get(spot.id);
        if (!r) {
          scores.set(spot.id, null);
          continue;
        }
        const avg = averageRatio(r.data);
        scores.set(spot.id, calcTrendScore(avg));
      }
    } catch (err) {
      console.error('now-score trend batch failed', err);
      for (const spot of batch) {
        scores.set(spot.id, null);
      }
    }
  }

  return scores;
}

async function collectYoyScores(
  spots: readonly SpotRecord[],
  env: { naverClientId: string; naverClientSecret: string },
  now: Date,
): Promise<Map<string, number | null>> {
  const scores = new Map<string, number | null>();
  if (spots.length === 0) return scores;

  const recentEnd = now;
  const recentStart = new Date(recentEnd.getTime() - YOY_WINDOW_DAYS * DAY_MS);
  const oneYearAgo = new Date(now);
  oneYearAgo.setUTCFullYear(oneYearAgo.getUTCFullYear() - 1);
  const lastYearStart = new Date(
    oneYearAgo.getTime() - YOY_WINDOW_DAYS * DAY_MS,
  );

  const startDate = formatDate(lastYearStart);
  const endDate = formatDate(recentEnd);

  const batches = chunk(spots, TREND_GROUP_BATCH_SIZE);

  for (const batch of batches) {
    const groups = batch.map(buildTrendGroup);
    try {
      const results = await fetchSearchTrends({
        clientId: env.naverClientId,
        clientSecret: env.naverClientSecret,
        startDate,
        endDate,
        groups,
      });
      const byName = new Map(results.map((r) => [r.groupName, r]));
      for (const spot of batch) {
        const r = byName.get(spot.id);
        if (!r) {
          scores.set(spot.id, null);
          continue;
        }
        const recentPoints = r.data.filter((d) => {
          const ts = new Date(`${d.period}T00:00:00Z`).getTime();
          return ts >= recentStart.getTime() && ts <= recentEnd.getTime();
        });
        const lastYearPoints = r.data.filter((d) => {
          const ts = new Date(`${d.period}T00:00:00Z`).getTime();
          return (
            ts >= lastYearStart.getTime() && ts <= oneYearAgo.getTime()
          );
        });
        if (recentPoints.length === 0 || lastYearPoints.length === 0) {
          scores.set(spot.id, null);
          continue;
        }
        const recentAvg = averageRatio(recentPoints);
        const lastYearAvg = averageRatio(lastYearPoints);
        scores.set(spot.id, calcYoyScore(recentAvg, lastYearAvg));
      }
    } catch (err) {
      console.error('now-score yoy batch failed', err);
      for (const spot of batch) {
        scores.set(spot.id, null);
      }
    }
  }

  return scores;
}

async function computeContentScore(
  spot: SpotRecord,
  env: {
    naverClientId: string;
    naverClientSecret: string;
    youtubeApiKey: string;
  },
  now: Date,
): Promise<number | null> {
  const query = buildSpotQuery(spot);
  const cutoff = new Date(now.getTime() - CONTENT_LOOKBACK_DAYS * DAY_MS);

  try {
    const [blogs, videos] = await Promise.all([
      searchBlogs({
        clientId: env.naverClientId,
        clientSecret: env.naverClientSecret,
        query,
        sort: 'date',
        display: 100,
      }),
      searchYouTube({
        apiKey: env.youtubeApiKey,
        query,
        publishedAfter: cutoff,
        maxResults: 50,
      }),
    ]);

    const recentBlogCount = blogs.filter(
      (b) => b.postedAt.getTime() >= cutoff.getTime(),
    ).length;
    const recentVideoCount = videos.length;

    return calcContentScore(recentBlogCount, recentVideoCount);
  } catch (err) {
    console.error('now-score content failed', spot.id, err);
    return null;
  }
}

export async function POST(req: Request) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const supabase = createAdminSupabaseClient();
  const env = getExternalApiEnv();
  const now = new Date();

  const { data: spotsData, error } = await supabase
    .from('spots')
    .select(
      'id, name, latitude, longitude, bloom_start_at, bloom_end_at, flower_id, flowers!inner(name_ko, aliases)',
    )
    .eq('status', 'published');

  if (error) {
    console.error('now-score spots query failed', error);
    return NextResponse.json(
      { error: 'spots_query_failed' },
      { status: 500 },
    );
  }

  const spots = (spotsData ?? []) as unknown as SpotRecord[];

  const trendScores = await collectTrendScores(spots, env, now);
  const yoyScores = await collectYoyScores(spots, env, now);

  let processed = 0;
  for (const spot of spots) {
    try {
      const { nx, ny } = latLngToKmaGrid(spot.latitude, spot.longitude);

      let tempC: number | null = null;
      let precipitationMm = 0;
      try {
        const forecast = await fetchShortForecast({
          nx,
          ny,
          serviceKey: env.kmaServiceKey,
        });
        tempC = forecast.tempC;
        precipitationMm = forecast.precipitationMm ?? 0;
      } catch (err) {
        console.error('now-score kma failed', spot.id, err);
      }

      const bloom =
        spot.bloom_start_at && spot.bloom_end_at
          ? calcBloomScore({
              now,
              startAt: new Date(spot.bloom_start_at),
              endAt: new Date(spot.bloom_end_at),
              recentTempC: tempC,
              recent7dRainMm: precipitationMm,
            })
          : null;

      const trend = trendScores.get(spot.id) ?? null;
      const content = await computeContentScore(spot, env, now);
      const yoy = yoyScores.get(spot.id) ?? null;

      const nowScore = calcNowScore({ bloom, trend, content, yoy });

      const updatePayload: SpotUpdate = {
        bloom_score: bloom,
        trend_score: trend,
        content_score: content,
        yoy_score: yoy,
        now_score: nowScore,
        now_score_at: now.toISOString(),
      };

      const { error: updateError } = await (
        supabase.from('spots') as unknown as {
          update: (
            values: SpotUpdate,
          ) => {
            eq: (
              column: string,
              value: string,
            ) => Promise<{ error: unknown }>;
          };
        }
      )
        .update(updatePayload)
        .eq('id', spot.id);

      if (updateError) {
        console.error('now-score update failed', spot.id, updateError);
        continue;
      }

      processed++;
    } catch (err) {
      console.error('now-score spot failed', spot.id, err);
    }
  }

  return NextResponse.json({ ok: true, processed });
}

export type { SpotRecord, TrendKeywords };
