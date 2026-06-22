/**
 * B-4 TDD: getTopSpotsWithBoost — 부스트 명소를 limit n 안으로 끌어올리는 병합 로직
 * FR-5-1: 활성 부스트 꽃의 공개 명소가 개수 제한(limit n)에 의해 누락되지 않도록 우선 포함
 *
 * 테스트 전략 (2-step 조회 계약 검증):
 * - getActiveBoostedSpots는 ① from('flowers')로 활성 부스트 꽃 id를 조회하고
 *   ② from('spots').in('flower_id', ids)로 그 꽃의 명소만 가져온다(PostgREST 임베디드 필터 미의존).
 * - mock은 호출 순서가 아니라 "테이블명 + 메서드 인자"로 분기한다:
 *     from('flowers')           → boostedFlowerRows
 *     from('spots') + .in(...)  → boostedSpotsRows (2-step의 2단계)
 *     from('spots') (그 외)     → topSpotsRows     (getTopSpots)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

type AnyFn = (...args: unknown[]) => unknown;

// ── mock 상태 ────────────────────────────────────────────────────────────────
let topSpotsRows: unknown[] = [];
let boostedFlowerRows: unknown[] = []; // from('flowers') 반환 ([{ id }])
let boostedSpotsRows: unknown[] = []; // from('spots').in(...) 반환
// 호출 추적 (2-step 계약 검증용)
let flowersQueried = false;
let spotsInQueried = false;

function makeChain(resolve: () => unknown[]) {
  const chain: Record<string, AnyFn> & PromiseLike<unknown> = {
    select(..._args: unknown[]) {
      return chain;
    },
    eq(..._args: unknown[]) {
      return chain;
    },
    not(..._args: unknown[]) {
      return chain;
    },
    in(..._args: unknown[]) {
      spotsInQueried = true;
      return chain;
    },
    lte(..._args: unknown[]) {
      return chain;
    },
    gte(..._args: unknown[]) {
      return chain;
    },
    order(..._args: unknown[]) {
      return chain;
    },
    limit(..._args: unknown[]) {
      return chain;
    },
    maybeSingle() {
      const rows = resolve();
      return Promise.resolve({ data: rows[0] ?? null, error: null });
    },
    then(onFulfilled?: (v: { data: unknown; error: unknown }) => unknown) {
      return Promise.resolve({ data: resolve(), error: null }).then(onFulfilled);
    },
  } as Record<string, AnyFn> & PromiseLike<unknown>;
  return chain;
}

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: (table: string) => {
      if (table === 'flowers') {
        flowersQueried = true;
        return makeChain(() => boostedFlowerRows);
      }
      // table === 'spots': .in() 호출 여부로 2-step의 2단계(부스트 명소)인지 구분
      let usedIn = false;
      const spotsChain: Record<string, AnyFn> & PromiseLike<unknown> = {
        select(..._args: unknown[]) {
          return spotsChain;
        },
        eq(..._args: unknown[]) {
          return spotsChain;
        },
        not(..._args: unknown[]) {
          return spotsChain;
        },
        in(..._args: unknown[]) {
          usedIn = true;
          spotsInQueried = true;
          return spotsChain;
        },
        lte(..._args: unknown[]) {
          return spotsChain;
        },
        gte(..._args: unknown[]) {
          return spotsChain;
        },
        order(..._args: unknown[]) {
          return spotsChain;
        },
        limit(..._args: unknown[]) {
          return spotsChain;
        },
        maybeSingle() {
          const rows = usedIn ? boostedSpotsRows : topSpotsRows;
          return Promise.resolve({ data: rows[0] ?? null, error: null });
        },
        then(onFulfilled?: (v: { data: unknown; error: unknown }) => unknown) {
          const rows = usedIn ? boostedSpotsRows : topSpotsRows;
          return Promise.resolve({ data: rows, error: null }).then(onFulfilled);
        },
      } as Record<string, AnyFn> & PromiseLike<unknown>;
      return spotsChain;
    },
  },
}));

import { getTopSpotsWithBoost } from './spotRepository';

// KST 2026-06-15 기준으로 boost_start_at/end_at 설정
const TODAY = new Date('2026-06-15T00:00:00+09:00');

const base = {
  slug: '',
  name: '',
  flower: {
    name_ko: '벚꽃',
    thumbnail_url: null,
    is_active: true,
    boost_start_at: null as string | null,
    boost_end_at: null as string | null,
  },
  region_secondary: '서울',
  description: '',
  short_tip: '',
  admission_fee: null,
  parking_info: null,
  festival_start_at: null,
  festival_end_at: null,
  bloom_start_at: '2026-03-28',
  bloom_end_at: '2026-04-10',
  is_featured: false,
  latitude: 37,
  longitude: 127,
  thumbnail_url: null,
};

function makeRow(id: string, nowScore: number, boosted = false) {
  return {
    ...base,
    id,
    slug: id,
    name: id,
    flower_id: boosted ? 'f-boost' : 'f-normal',
    now_score: nowScore,
    flower: {
      ...base.flower,
      boost_start_at: boosted ? '2026-06-01' : null,
      boost_end_at: boosted ? '2026-06-30' : null,
    },
  };
}

describe('getTopSpotsWithBoost', () => {
  beforeEach(() => {
    topSpotsRows = [];
    boostedFlowerRows = [];
    boostedSpotsRows = [];
    flowersQueried = false;
    spotsInQueried = false;
  });

  it('부스트 명소가 없을 때 getTopSpots(n) 결과 그대로 반환한다(NFR-6 회귀 없음)', async () => {
    topSpotsRows = [makeRow('a', 95), makeRow('b', 88), makeRow('c', 70)];
    boostedFlowerRows = [];

    const result = await getTopSpotsWithBoost(3, TODAY);

    expect(result).toHaveLength(3);
    expect(result.map((s) => s.id)).toEqual(['a', 'b', 'c']);
    expect(result.every((s) => !s.isBoosted)).toBe(true);
  });

  it('활성 부스트 꽃이 없으면 flowers만 조회하고 spots는 추가 조회하지 않는다(2-step·비부스트 거름)', async () => {
    topSpotsRows = [makeRow('a', 95)];
    boostedFlowerRows = []; // 활성 부스트 꽃 0건

    await getTopSpotsWithBoost(3, TODAY);

    // 임베디드 필터가 아니라 flowers 테이블을 먼저 조회해야 한다
    expect(flowersQueried).toBe(true);
    // 활성 부스트 꽃이 없으면 spots.in(...) 보조 조회를 건너뛴다
    expect(spotsInQueried).toBe(false);
  });

  it('now_score가 낮아 top-n에 없던 부스트 명소가 limit n 안으로 끌어올려진다(FR-5-1 핵심)', async () => {
    topSpotsRows = [makeRow('non-1', 95), makeRow('non-2', 88), makeRow('non-3', 70)];
    boostedFlowerRows = [{ id: 'f-boost' }];
    boostedSpotsRows = [makeRow('boost-1', 20, true)];

    const result = await getTopSpotsWithBoost(3, TODAY);

    expect(result.some((s) => s.id === 'boost-1')).toBe(true);
    expect(result[0]?.id).toBe('boost-1');
    expect(result[0]?.isBoosted).toBe(true);
    expect(result).toHaveLength(3);
  });

  it('부스트 명소가 이미 top-n에 포함된 경우 중복 없이 반환한다', async () => {
    topSpotsRows = [makeRow('boost-1', 90, true), makeRow('non-1', 88), makeRow('non-2', 70)];
    boostedFlowerRows = [{ id: 'f-boost' }];
    boostedSpotsRows = [makeRow('boost-1', 90, true)];

    const result = await getTopSpotsWithBoost(3, TODAY);

    expect(result).toHaveLength(3);
    const ids = result.map((s) => s.id);
    expect(new Set(ids).size).toBe(3);
  });

  it('여러 부스트 명소가 있을 때 모두 상위에 오고 그룹 내 now_score 내림차순이다', async () => {
    topSpotsRows = [makeRow('non-1', 95), makeRow('non-2', 88), makeRow('non-3', 70)];
    boostedFlowerRows = [{ id: 'f-boost' }];
    boostedSpotsRows = [makeRow('boost-low', 15, true), makeRow('boost-high', 30, true)];

    const result = await getTopSpotsWithBoost(3, TODAY);

    expect(result[0]?.isBoosted).toBe(true);
    expect(result[1]?.isBoosted).toBe(true);
    expect(result[0]?.nowScore).toBeGreaterThanOrEqual(result[1]?.nowScore ?? -1);
    expect(result[2]?.isBoosted).toBe(false);
    expect(result[2]?.nowScore).toBe(95);
  });

  it('n보다 부스트 명소가 많으면 상위 n개만 반환한다', async () => {
    topSpotsRows = [makeRow('non-1', 95), makeRow('non-2', 88), makeRow('non-3', 70)];
    boostedFlowerRows = [{ id: 'f-boost' }];
    boostedSpotsRows = [
      makeRow('boost-1', 50, true),
      makeRow('boost-2', 40, true),
      makeRow('boost-3', 30, true),
      makeRow('boost-4', 20, true),
    ];

    const result = await getTopSpotsWithBoost(3, TODAY);

    expect(result).toHaveLength(3);
  });
});
