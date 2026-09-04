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
import {
  averageAtWeeks,
  newestWeekStarts,
  oldestWeekStarts,
  peakRelativeAverage,
  weekAlignedTrendWindow,
} from '@/lib/now-score/trendWindow';
import { calcYoyScore } from '@/lib/now-score/yoy';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import type { SpotUpdate } from '@/lib/types';

export const maxDuration = 300;

// 데이터랩은 "요청한 기간 안에서 최댓값을 100"으로 정규화해 돌려준다.
// 7일만 요청하면 그 7일의 최댓값이 100이 되어 비수기 꽃도 평균 90점을 받았다.
// 1년 남짓을 요청해야 최근 값이 곧 연중 위치(=계절성)를 나타낸다.
// 구간 계산은 weekAlignedTrendWindow가 담당한다.
// 장기 구간을 'date'로 받으면 포인트가 수백 개가 되어 과거 타임아웃이 재발한다.
// 'week'은 54포인트라 안전하고, 작년 동기가 같은 응답 앞부분에 들어 있어
// yoy용 별도 요청도 필요 없다.
const TREND_TIME_UNIT = 'week' as const;
// 최신 주 / 가장 오래된 주를 각각 몇 주씩 평균할지. 한 주만 쓰면 그 주의
// 우연한 변동에 점수가 흔들려 2주를 평균한다. 대신 개화 급상승 구간에서
// 신호가 약 1주 늦게 반영된다.
const TREND_EDGE_POINTS = 2;
const TREND_GROUP_BATCH_SIZE = 5;
const SPOT_PROCESS_CONCURRENCY = 4;
// Datalab burst throttle 완화를 위해 배치 간 짧게 대기.
const DATALAB_BATCH_INTERVAL_MS = 200;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

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

  // 1년 남짓한 창을 주단위로 한 번만 요청한다. 데이터랩이 이 구간의 최댓값을
  // 100으로 정규화하므로 최근 값이 곧 계절 위치가 되고, 창의 앞부분이 작년
  // 동기라 yoy도 같은 응답에서 계산할 수 있다. (요청 횟수 배치당 2회 → 1회)
  // 구간은 주 경계에 맞춘다 — 아직 다 게시되지 않은 주가 끼면 값이 깎이고
  // cron이 도는 요일에 따라 점수가 달라진다.
  const searchWindow = weekAlignedTrendWindow(now);
  const { startDate, endDate } = searchWindow;
  // 값은 배열 위치가 아니라 주 시작일로 집는다. 데이터랩이 검색량 미달 주를
  // 버킷째로 생략하므로, 위치로 뽑으면 희소한 키워드에서 엉뚱한 달력 위치를
  // 최신값으로 집는다.
  const newestWeeks = newestWeekStarts(searchWindow, TREND_EDGE_POINTS);
  const oldestWeeks = oldestWeekStarts(searchWindow, TREND_EDGE_POINTS);

  const batches = chunk(spots, TREND_GROUP_BATCH_SIZE);

  for (let i = 0; i < batches.length; i++) {
    if (i > 0) await sleep(DATALAB_BATCH_INTERVAL_MS);
    const batch = batches[i];
    const groups = batch.map(buildTrendGroup);
    const results = await fetchSearchTrends({
      clientId: env.naverClientId,
      clientSecret: env.naverClientSecret,
      startDate,
      endDate,
      groups,
      timeUnit: TREND_TIME_UNIT,
    }).catch((err: unknown) => {
      console.error('now-score datalab batch failed', err);
      return null;
    });

    const byName = new Map(
      (results ?? []).map((r: TrendResult) => [r.groupName, r]),
    );

    for (const spot of batch) {
      const data = byName.get(spot.id)?.data ?? [];
      // trend는 그룹 자신의 창 내 최댓값 대비 상대값으로 잰다. 데이터랩이
      // 요청에 든 모든 그룹을 통틀어 정규화하므로, 원시 ratio를 쓰면 같은
      // 명소 점수가 배치 동료에 따라 달라진다.
      const recentPeakRelative = peakRelativeAverage(data, newestWeeks);
      // yoy는 최근/작년의 비율이라 정규화 배율이 이미 상쇄된다. 원시 값 사용.
      const recentAvg = averageAtWeeks(data, newestWeeks);
      const lastYearAvg = averageAtWeeks(data, oldestWeeks);

      trend.set(
        spot.id,
        recentPeakRelative === null
          ? null
          : calcTrendScore(recentPeakRelative),
      );

      yoy.set(
        spot.id,
        recentAvg === null || lastYearAvg === null
          ? null
          : calcYoyScore(recentAvg, lastYearAvg),
      );
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
