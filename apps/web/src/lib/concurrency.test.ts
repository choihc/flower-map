import { describe, expect, it } from 'vitest';
import { mapWithConcurrency } from './concurrency';

describe('mapWithConcurrency', () => {
  it('결과는 입력과 동일한 인덱스 순서를 유지한다', async () => {
    const items = [1, 2, 3, 4, 5];
    const result = await mapWithConcurrency(items, 2, async (x) => {
      // 임의의 지연으로 실행 순서는 섞이지만 인덱스 매핑은 보존되어야 함
      await new Promise((r) => setTimeout(r, (5 - x) * 5));
      return x * 10;
    });
    expect(result).toEqual([10, 20, 30, 40, 50]);
  });

  it('concurrency 상한을 초과하지 않는다', async () => {
    let active = 0;
    let peak = 0;
    const items = Array.from({ length: 20 }, (_, i) => i);
    await mapWithConcurrency(items, 4, async () => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((r) => setTimeout(r, 10));
      active--;
    });
    expect(peak).toBeLessThanOrEqual(4);
    expect(peak).toBeGreaterThan(0);
  });

  it('어느 워커가 throw하면 Promise가 reject된다', async () => {
    const items = [1, 2, 3];
    await expect(
      mapWithConcurrency(items, 2, async (x) => {
        if (x === 2) throw new Error('boom');
        return x;
      }),
    ).rejects.toThrow('boom');
  });

  it('limit이 0 이하면 TypeError를 던진다', async () => {
    await expect(mapWithConcurrency([1], 0, async (x) => x)).rejects.toThrow(
      TypeError,
    );
  });

  it('빈 배열은 빈 배열을 반환한다', async () => {
    const result = await mapWithConcurrency([], 3, async (x) => x);
    expect(result).toEqual([]);
  });
});
