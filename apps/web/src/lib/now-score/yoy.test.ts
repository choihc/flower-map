import { describe, it, expect } from 'vitest';
import { calcYoyScore } from './yoy';

describe('calcYoyScore', () => {
  it('작년 평균이 0이면 50 (중립)', () => {
    expect(calcYoyScore(100, 0)).toBe(50);
  });

  it('작년 평균이 음수면 50 (중립)', () => {
    expect(calcYoyScore(100, -5)).toBe(50);
  });

  it('ratio=1이면 50', () => {
    expect(calcYoyScore(50, 50)).toBe(50);
  });

  it('ratio=2면 100 (최대)', () => {
    expect(calcYoyScore(100, 50)).toBe(100);
  });

  it('ratio=0.5면 25', () => {
    expect(calcYoyScore(50, 100)).toBe(25);
  });

  it('ratio=3이면 100 (상한 클램프)', () => {
    expect(calcYoyScore(300, 100)).toBe(100);
  });

  it('ratio=0이면 0 (하한 클램프)', () => {
    expect(calcYoyScore(0, 100)).toBe(0);
  });
});
