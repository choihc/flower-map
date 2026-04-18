import { describe, it, expect } from 'vitest';
import { calcContentScore } from './content';

describe('calcContentScore', () => {
  it('(0, 0) → 0', () => {
    expect(calcContentScore(0, 0)).toBe(0);
  });

  it('(30, 10) → 100 (만점)', () => {
    expect(calcContentScore(30, 10)).toBeCloseTo(100, 2);
  });

  it('(15, 5) → 50 (절반씩)', () => {
    expect(calcContentScore(15, 5)).toBeCloseTo(50, 2);
  });

  it('(100, 50) → 100 (상한 클램프)', () => {
    expect(calcContentScore(100, 50)).toBeCloseTo(100, 2);
  });

  it('(30, 0) → 60 (블로그 만점, 영상 0)', () => {
    expect(calcContentScore(30, 0)).toBeCloseTo(60, 2);
  });

  it('(0, 10) → 40 (블로그 0, 영상 만점)', () => {
    expect(calcContentScore(0, 10)).toBeCloseTo(40, 2);
  });
});
