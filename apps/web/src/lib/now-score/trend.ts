export function calcTrendScore(recent7dAvgRatio: number): number {
  return Math.max(0, Math.min(100, Math.round(recent7dAvgRatio * 100) / 100));
}
