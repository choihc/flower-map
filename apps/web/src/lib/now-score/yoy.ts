export function calcYoyScore(
  recentAvg: number,
  lastYearAvg: number,
): number | null {
  if (lastYearAvg <= 0) return null;
  const ratio = recentAvg / lastYearAvg;
  const delta = Math.max(-50, Math.min(50, (ratio - 1) * 50));
  return Math.round((delta + 50) * 100) / 100;
}
