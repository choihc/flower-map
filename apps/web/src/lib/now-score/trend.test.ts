import { describe, it, expect } from 'vitest';
import { calcTrendScore } from './trend';

describe('calcTrendScore', () => {
  it('0 → 0', () => {
    expect(calcTrendScore(0)).toBe(0);
  });

  it('50 → 50', () => {
    expect(calcTrendScore(50)).toBe(50);
  });

  it('100 → 100', () => {
    expect(calcTrendScore(100)).toBe(100);
  });

  it('110 → 100 (상한 클램프)', () => {
    expect(calcTrendScore(110)).toBe(100);
  });

  it('-5 → 0 (하한 클램프)', () => {
    expect(calcTrendScore(-5)).toBe(0);
  });

  it('소수점 2자리 반올림', () => {
    expect(calcTrendScore(55.5678)).toBeCloseTo(55.57, 2);
  });
});
