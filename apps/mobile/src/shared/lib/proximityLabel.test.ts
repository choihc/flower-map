import { describe, expect, it } from 'vitest';

import { formatProximity } from './proximityLabel';

describe('formatProximity', () => {
  it('distanceKm가 0이면 "<subject> 바로 옆"을 반환한다', () => {
    expect(formatProximity(0, '이 명소')).toBe('이 명소 바로 옆');
  });

  it('distanceKm가 0.099 (경계 미만) 이면 "<subject> 바로 옆"을 반환한다', () => {
    expect(formatProximity(0.099, '이 명소')).toBe('이 명소 바로 옆');
  });

  it('distanceKm가 0.1 (경계 포함) 이면 formatDistance 결과를 사용한다', () => {
    // formatDistance(0.1) = "100m"
    expect(formatProximity(0.1, '이 명소')).toBe('이 명소에서 100m');
  });

  it('distanceKm가 1.0이면 "<subject>에서 1km"', () => {
    expect(formatProximity(1.0, '장미공원')).toBe('장미공원에서 1km');
  });

  it('distanceKm가 6.2면 "<subject>에서 6.2km"', () => {
    expect(formatProximity(6.2, '장미공원')).toBe('장미공원에서 6.2km');
  });

  it('subject가 빈 문자열이어도 정상 동작한다 (방어적 처리는 호출부 책임)', () => {
    expect(formatProximity(5.0, '')).toBe('에서 5km');
  });
});
