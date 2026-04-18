import { BADGE_THRESHOLDS as T } from './weights';

export type NowBadge = 'bloom-peak' | 'trending' | 'yoy-rising';

export function pickBadges(scores: {
  bloom: number | null;
  trend: number | null;
  yoy: number | null;
}): NowBadge[] {
  const out: NowBadge[] = [];
  if ((scores.bloom ?? 0) >= T.bloomPeak) out.push('bloom-peak');
  if ((scores.trend ?? 0) >= T.trending) out.push('trending');
  if ((scores.yoy ?? 0) >= T.yoyRising) out.push('yoy-rising');
  return out;
}
