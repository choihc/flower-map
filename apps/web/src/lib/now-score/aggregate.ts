import { NOW_SCORE_WEIGHTS as W } from './weights';

export interface NowScoreInput {
  bloom: number | null;
  trend: number | null;
  content: number | null;
  yoy: number | null;
}

export function calcNowScore(input: NowScoreInput): number | null {
  const parts: Array<{ value: number; weight: number }> = [];
  if (input.bloom !== null) parts.push({ value: input.bloom, weight: W.bloom });
  if (input.trend !== null) parts.push({ value: input.trend, weight: W.trend });
  if (input.content !== null)
    parts.push({ value: input.content, weight: W.content });
  if (input.yoy !== null) parts.push({ value: input.yoy, weight: W.yoy });

  if (parts.length === 0) return null;

  // bloom/trend/content가 전부 null이면 yoy 단독으로는 의미가 약하므로 null 유지
  const hasPrimary =
    input.bloom !== null || input.trend !== null || input.content !== null;
  if (!hasPrimary) return null;

  const weightSum = parts.reduce((s, p) => s + p.weight, 0);
  if (weightSum === 0) return null;
  const weighted = parts.reduce((s, p) => s + p.value * p.weight, 0);
  return Math.round((weighted / weightSum) * 100) / 100;
}
