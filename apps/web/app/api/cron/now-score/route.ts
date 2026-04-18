import { NextResponse } from 'next/server';

import { mapWithConcurrency } from '@/lib/concurrency';
import { verifyCronAuth } from '@/lib/cron/auth';
import { getExternalApiEnv } from '@/lib/env';
import { fetchShortForecast } from '@/lib/external/kma';
import {
  fetchSearchTrends,
  type TrendGroup,
  type TrendResult,
} from '@/lib/external/naverDatalab';
import { calcBloomScore } from '@/lib/now-score/bloom';
import { calcContentScore } from '@/lib/now-score/content';
import { calcNowScore } from '@/lib/now-score/aggregate';
import { calcTrendScore } from '@/lib/now-score/trend';
import { calcYoyScore } from '@/lib/now-score/yoy';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import type { SpotUpdate } from '@/lib/types';

export const maxDuration = 300;

const TREND_LOOKBACK_DAYS = 7;
const YOY_WINDOW_DAYS = 7;
const TREND_GROUP_BATCH_SIZE = 5;
const DAY_MS = 86400000;
const SPOT_PROCESS_CONCURRENCY = 4;

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

async function collectTrendAndYoyScores(
  spots: readonly SpotRecord[],
  env: { naverClientId: string; naverClientSecret: string },
  now: Date,
): Promise<{
  trend: Map<string, number | null>;
  yoy: Map<string, number | null>;
}> {
  const trend = new Map<string, number | null>();
  const yoy = new Map<string, number | null>();
  if (spots.length === 0) return { trend, yoy };

  // 작년 7일부터 오늘까지 한 번에 조회하고, 내부에서 recent/lastYear 구간을 잘라 쓴다.
  // 이렇게 하면 trend·yoy를 각각 호출하던 기존 2회가 1회로 줄어든다.
  const recentEnd = now;
  const recentStart = new Date(recentEnd.getTime() - TREND_LOOKBACK_DAYS * DAY_MS);
  const oneYearAgoEnd = new Date(now.getTime() - 365 * DAY_MS);
  const lastYearStart = new Date(
    now.getTime() - (365 + YOY_WINDOW_DAYS) * DAY_MS,
  );

  const startDate = formatDate(lastYearStart);
  const endDate = formatDate(recentEnd);

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
          trend.set(spot.id, null);
          yoy.set(spot.id, null);
          continue;
        }

        const recentPoints = r.data.filter((d) => {
          const ts = new Date(`${d.period}T00:00:00Z`).getTime();
          return ts >= recentStart.getTime() && ts <= recentEnd.getTime();
        });
        const lastYearPoints = r.data.filter((d) => {
          const ts = new Date(`${d.period}T00:00:00Z`).getTime();
          return ts >= lastYearStart.getTime() && ts <= oneYearAgoEnd.getTime();
        });

        trend.set(
          spot.id,
          recentPoints.length === 0 ? null : calcTrendScore(averageRatio(recentPoints)),
        );

        if (recentPoints.length === 0 || lastYearPoints.length === 0) {
          yoy.set(spot.id, null);
        } else {
          yoy.set(
            spot.id,
            calcYoyScore(averageRatio(recentPoints), averageRatio(lastYearPoints)),
          );
        }
      }
    } catch (err) {
      console.error('now-score datalab batch failed', err);
      for (const spot of batch) {
        trend.set(spot.id, null);
        yoy.set(spot.id, null);
      }
    }
  }

  return { trend, yoy };
}

type CountClient = {
  from: (table: string) => {
    select: (columns: string) => {
      in: (
        column: string,
        values: string[],
      ) => Promise<{ data: Array<{ spot_id: string }> | null; error: unknown }>;
    };
  };
};

async function collectContentCountMap(
  supabase: CountClient,
  table: 'spot_videos' | 'spot_blogs',
  spotIds: string[],
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (spotIds.length === 0) return counts;
  const { data, error } = await supabase
    .from(table)
    .select('spot_id')
    .in('spot_id', spotIds);
  if (error) {
    console.error(`now-score count query failed for ${table}`, error);
    return counts;
  }
  for (const row of data ?? []) {
    counts.set(row.spot_id, (counts.get(row.spot_id) ?? 0) + 1);
  }
  return counts;
}

export async function GET(req: Request) {
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
  const spotIds = spots.map((s) => s.id);

  const { trend: trendScores, yoy: yoyScores } = await collectTrendAndYoyScores(
    spots,
    env,
    now,
  );
  const videoCounts = await collectContentCountMap(
    supabase as unknown as CountClient,
    'spot_videos',
    spotIds,
  );
  const blogCounts = await collectContentCountMap(
    supabase as unknown as CountClient,
    'spot_blogs',
    spotIds,
  );

  const processResults = await mapWithConcurrency(
    spots,
    SPOT_PROCESS_CONCURRENCY,
    async (spot): Promise<boolean> => {
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
        const blogCount = blogCounts.get(spot.id) ?? 0;
        const videoCount = videoCounts.get(spot.id) ?? 0;
        const content = calcContentScore(blogCount, videoCount);
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
          return false;
        }
        return true;
      } catch (err) {
        console.error('now-score spot failed', spot.id, err);
        return false;
      }
    },
  );
  const processed = processResults.filter(Boolean).length;

  return NextResponse.json({ ok: true, processed });
}

export type { SpotRecord, TrendKeywords };
