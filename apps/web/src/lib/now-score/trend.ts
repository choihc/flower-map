/**
 * 데이터랩 검색량 비율을 그대로 트렌드 점수로 쓴다.
 *
 * 인자는 54주 창의 최신 주간 버킷 평균 비율이다. 데이터랩이 창 안의 최댓값을
 * 100으로 정규화하므로, 이 값이 곧 "연중 최고 대비 지금 어디쯤인가"가 된다.
 */
export function calcTrendScore(recentAvgRatio: number): number {
  return Math.max(0, Math.min(100, Math.round(recentAvgRatio * 100) / 100));
}
