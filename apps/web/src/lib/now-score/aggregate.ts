import { NOW_SCORE_WEIGHTS as W } from './weights';

export interface NowScoreInput {
  bloom: number | null;
  trend: number | null;
  content: number | null;
  yoy: number | null;
}

export function calcNowScore(input: NowScoreInput): number | null {
  if (input.bloom === null && input.trend === null && input.content === null) return null;
  const val = (n: number | null) => n ?? 0;
  const s =
    W.bloom * val(input.bloom) +
    W.trend * val(input.trend) +
    W.content * val(input.content) +
    W.yoy * val(input.yoy);
  return Math.round(s * 100) / 100;
}
