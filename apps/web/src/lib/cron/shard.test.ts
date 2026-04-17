import { describe, expect, it } from 'vitest';

import { shardIndex, todayShard } from './shard';

describe('shardIndex', () => {
  it('동일 ID는 항상 동일한 샤드를 반환한다 (결정적)', () => {
    const id = 'f8a2b4c6-1234-5678-9abc-def012345678';
    const first = shardIndex(id);
    const second = shardIndex(id);
    const third = shardIndex(id);

    expect(first).toBe(second);
    expect(second).toBe(third);
    expect(first).toBeGreaterThanOrEqual(0);
    expect(first).toBeLessThan(7);
  });

  it('100개의 UUID를 7개 샤드로 분산하면 모든 샤드가 최소 1개 이상 할당된다', () => {
    const ids = Array.from({ length: 100 }, (_, i) => {
      const hex = i.toString(16).padStart(8, '0');
      return `${hex}-aaaa-bbbb-cccc-dddddddddddd`;
    });

    const counts = new Array(7).fill(0);
    for (const id of ids) {
      counts[shardIndex(id)]++;
    }

    for (const count of counts) {
      expect(count).toBeGreaterThan(0);
    }
    expect(counts.reduce((a, b) => a + b, 0)).toBe(100);
  });

  it('totalShards 파라미터를 존중한다', () => {
    const id = 'spot-abc';
    const result = shardIndex(id, 3);

    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThan(3);
  });

  it('빈 문자열도 음수가 아닌 유효한 샤드를 반환한다', () => {
    const result = shardIndex('', 7);

    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThan(7);
  });
});

describe('todayShard', () => {
  it('UTC 요일 기반으로 0~6 범위의 값을 반환한다', () => {
    // 2026-04-17은 UTC 금요일 (getUTCDay() === 5)
    const friday = new Date('2026-04-17T03:00:00Z');
    expect(todayShard(friday)).toBe(5);

    // 2026-04-19는 UTC 일요일 (getUTCDay() === 0)
    const sunday = new Date('2026-04-19T03:00:00Z');
    expect(todayShard(sunday)).toBe(0);
  });

  it('totalShards=7의 경우 요일과 동일한 값을 반환한다', () => {
    for (let day = 0; day < 7; day++) {
      // 2026년 1월 4일이 일요일(0). day만큼 더하면 해당 요일.
      const date = new Date(Date.UTC(2026, 0, 4 + day));
      expect(todayShard(date)).toBe(day);
    }
  });
});
