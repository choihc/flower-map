export function calcContentScore(recentBlogCount: number, recentVideoCount: number): number {
  const b = Math.min(1, recentBlogCount / 30) * 100 * 0.6;
  const v = Math.min(1, recentVideoCount / 10) * 100 * 0.4;
  return Math.round((b + v) * 100) / 100;
}
