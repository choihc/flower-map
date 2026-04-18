export const NOW_SCORE_WEIGHTS = {
  bloom: 0.47,
  trend: 0.29,
  content: 0.18,
  yoy: 0.06,
} as const;

export const BADGE_THRESHOLDS = {
  bloomPeak: 80,
  trending: 70,
  yoyRising: 70,
} as const;
