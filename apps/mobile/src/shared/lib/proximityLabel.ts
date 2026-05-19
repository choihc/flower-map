import { formatDistance } from './location';

const VERY_CLOSE_THRESHOLD_KM = 0.1;

/**
 * 호텔/장소 간 근접도를 사람이 읽을 수 있는 라벨로 변환한다.
 *
 * - `distanceKm < 0.1`(~100m 미만)이면 "<subject> 바로 옆"으로 치환.
 *   "이 명소에서 0m" 같은 어색한 표기를 막기 위한 가드.
 * - 그 외에는 기존 `formatDistance` 출력을 그대로 사용한다.
 */
export function formatProximity(distanceKm: number, subject: string): string {
  if (distanceKm < VERY_CLOSE_THRESHOLD_KM) {
    return `${subject} 바로 옆`;
  }
  return `${subject}에서 ${formatDistance(distanceKm)}`;
}
