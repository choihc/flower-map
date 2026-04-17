import { describe, it, expect } from 'vitest';
import { calcNowScore } from './aggregate';

describe('calcNowScore', () => {
  it('bloom/trend/content 모두 null이면 null 반환', () => {
    expect(calcNowScore({ bloom: null, trend: null, content: null, yoy: null })).toBeNull();
  });

  it('모두 100이면 100 (가중합 1.0)', () => {
    expect(
      calcNowScore({ bloom: 100, trend: 100, content: 100, yoy: 100 })
    ).toBeCloseTo(100, 2);
  });

  it('bloom만 100, 나머지 null이면 47', () => {
    expect(
      calcNowScore({ bloom: 100, trend: null, content: null, yoy: null })
    ).toBeCloseTo(47, 2);
  });

  it('trend=100, content=100, 나머지 null이면 47 (29 + 18)', () => {
    expect(
      calcNowScore({ bloom: null, trend: 100, content: 100, yoy: null })
    ).toBeCloseTo(47, 2);
  });

  it('yoy만 있어도 bloom/trend/content 모두 null이면 null', () => {
    expect(
      calcNowScore({ bloom: null, trend: null, content: null, yoy: 100 })
    ).toBeNull();
  });
});
