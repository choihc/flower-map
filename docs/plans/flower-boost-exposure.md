---
작성일: 2026-06-22
최종 수정일: 2026-06-22
관련 스펙: docs/specs/flower-boost-exposure-spec.md
---

# 꽃 집중 노출(Boost) 실행 플랜

스펙 `flower-boost-exposure-spec.md`(FR-1~6, NFR-1~7)을 충족하기 위한 실행 계획.

## 작업 범위 요약

- **DB**: `flowers` 테이블에 `boost_start_at`·`boost_end_at` 컬럼 추가 (마이그레이션 1개)
- **어드민(apps/web)**: 타입·스키마·폼·목록 배지 (FR-1, FR-2)
- **모바일(apps/mobile)**: 타입·select·매퍼·정렬 헬퍼·홈TOP·검색·명소목록 (FR-3, FR-4, FR-5-1~3)

---

## 단계 0 — 사전 확인 (베이스라인)

- **0-1** 베이스라인 테스트 통과 확인:
  ```bash
  pnpm --filter @flower-map/mobile test      # 모바일 vitest
  pnpm --filter @flower-map/flower-domain test
  pnpm --filter @flower-map/web test         # (있는 경우)
  ```
- **0-2** 가정 검증 — Supabase PostgREST 임베디드 필터(`flowers!inner` + `.eq('flower.col')`)가 동작하는지 확인. 동작하지 않으면 홈 TOP 부스트 조회를 **2-step**(활성 부스트 꽃 id 조회 → `flower_id IN`)로 대체한다(§Phase B-4 대안).
- **0-3** 현재 정렬 결과 스냅샷(부스트 미설정 시 회귀 비교 기준, NFR-6).

---

## 인터페이스 계약 (전 단계 공통)

```ts
// 활성 부스트 판정 — 모바일 구현
//   소비: { boost_start_at: string|null; boost_end_at: string|null }, now: Date
//   생산: boolean
isActiveBoost(flower, now): boolean

// 부스트 우선 비교자 팩토리
//   소비: base 비교자 (a,b)=>number
//   생산: (a: FlowerSpot, b: FlowerSpot)=>number  // 1차 isBoosted desc, 2차 base
boostFirst(base): (a, b) => number

// FlowerSpot 확장 (모바일)
//   + isBoosted: boolean

// KST 오늘 날짜 문자열
//   생산: 'YYYY-MM-DD'
kstToday(now=new Date()): string
```

---

## Phase A — DB & 어드민 (apps/web)

### A-1. 마이그레이션 작성 (FR-1, §3.1)
- **파일(신규)**: `supabase/migrations/20260622_flower_boost.sql`
  ```sql
  ALTER TABLE public.flowers
    ADD COLUMN IF NOT EXISTS boost_start_at date,
    ADD COLUMN IF NOT EXISTS boost_end_at   date;

  -- 활성 부스트 조회 가속 (선택)
  CREATE INDEX IF NOT EXISTS flowers_boost_idx
    ON public.flowers (boost_start_at, boost_end_at)
    WHERE boost_start_at IS NOT NULL AND boost_end_at IS NOT NULL;
  ```
- 검증: 로컬 Supabase에 적용 후 `\d flowers`로 컬럼 확인.

### A-2. 타입 확장
- **수정**: `apps/web/src/lib/types.ts`
  - `FlowerRow`에 `boost_start_at: string | null; boost_end_at: string | null;` 추가
  - `FlowerInsert`에 `boost_start_at?: string | null; boost_end_at?: string | null;` 추가
  - (`FlowerUpdate`는 `Partial<...>`이므로 자동 반영)

### A-3. 스키마 + 검증 (FR-2-3) — TDD
- **RED**: `apps/web/src/features/flowers/flowerSchema.test.ts`(신규 또는 기존에 추가)
  - 케이스: ① 둘 다 null → 통과 ② 둘 다 유효 날짜 & start<=end → 통과 ③ 한쪽만 입력 → 실패 ④ start>end → 실패
- **GREEN**: `apps/web/src/features/flowers/flowerSchema.ts`
  ```ts
  const boostDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional();
  export const flowerSchema = z.object({
    // ...기존
    boost_start_at: boostDate,
    boost_end_at: boostDate,
  }).superRefine((v, ctx) => {
    const s = v.boost_start_at ?? null;
    const e = v.boost_end_at ?? null;
    if ((s === null) !== (e === null)) {
      ctx.addIssue({ code: 'custom', message: '집중 노출 기간은 시작일과 종료일을 모두 입력해야 합니다.' });
    }
    if (s !== null && e !== null && s > e) {
      ctx.addIssue({ code: 'custom', message: '집중 노출 종료일은 시작일과 같거나 이후여야 합니다.' });
    }
  });
  ```

### A-4. 폼 입력 (FR-1-1, FR-1-2)
- **수정**: `apps/web/src/features/flowers/FlowerForm.tsx`
  - "표시 설정" 다음에 "집중 노출" `FormSection` 추가: `boost_start_at`/`boost_end_at` `type="date"` 입력 2개.
  - `handleSubmit`의 `safeParse` 객체에 추가:
    ```ts
    boost_start_at: normalizeOptionalText(formData.get('boost_start_at')),
    boost_end_at: normalizeOptionalText(formData.get('boost_end_at')),
    ```
  - 기존 `normalizeOptionalText` 재사용(빈 문자열 → null).

### A-5. 쓰기 경로 (FR-1-3)
- **수정**: `apps/web/src/lib/data/flowers.ts` — `buildFlowerWriteInput`에 boost 필드 통과 보장:
  ```ts
  boost_start_at: emptyToNull(input.boost_start_at),
  boost_end_at: emptyToNull(input.boost_end_at),
  ```
  - `createFlower`/`updateFlower`는 입력 객체를 그대로 전달하므로 추가 변경 불필요.
  - 기존 `submitAction`/`updateAction`의 `revalidatePath('/')`로 공개 반영(FR-1-3) — 변경 없음.

### A-6. 목록 상태 배지 (FR-2-1, FR-2-2) — TDD
- **신규 헬퍼**: `apps/web/src/features/flowers/boostStatus.ts`
  ```ts
  // boostStatus(flower, now): { kind: 'active'|'scheduled'|'expired'|'none'; label: string }
  //   active:    start<=today<=end → '집중 노출 중 D-{end-today}'
  //   scheduled: today<start        → '예약 {start MM.DD}~'
  //   expired:   end<today          → '만료'
  //   none:      날짜 미설정         → ''
  ```
  - **RED**: `boostStatus.test.ts` — 4개 분기 + 경계(시작일==오늘, 종료일==오늘) 케이스.
- **수정**: `apps/web/app/admin/(dashboard)/flowers/page.tsx` — 꽃 카드에 활성/예약/만료 배지 추가(기존 `Badge` 컴포넌트 재사용, `active`=기본/`scheduled`=secondary/`expired`=outline).
- **수정**: `apps/web/app/admin/(dashboard)/flowers/[id]/page.tsx` — 편집 화면 `defaultValue`에 boost 필드 포함 확인(getFlower가 `*` 조회이므로 자동 포함).

> Phase A 완료 시 커밋: `feat(web): 꽃 집중 노출 기간 설정·표시`

---

## Phase B — 모바일 (apps/mobile)

### B-1. 타입 + select 확장 (§7.2)
- **수정**: `apps/mobile/src/shared/data/types.ts`
  - `FlowerSpot`에 `isBoosted: boolean;` 추가
  - `PublishedSpotFlower`에 `boost_start_at: string | null; boost_end_at: string | null;` 추가
- **수정**: `apps/mobile/src/shared/data/spotRepository.ts`
  - 공통 select 상수 도입:
    ```ts
    const SPOT_SELECT = '*, flower:flowers(name_ko, thumbnail_url, is_active, boost_start_at, boost_end_at)';
    ```
  - `getPublishedSpots`, `getPublishedSpotBySlug`, `getTopSpots`의 select를 `SPOT_SELECT`로 교체.

### B-2. 부스트 판정 + 정렬 헬퍼 (FR-3, FR-4) — TDD
- **신규**: `apps/mobile/src/shared/data/boost.ts`
  ```ts
  export function kstToday(now = new Date()): string { /* KST 'YYYY-MM-DD' */ }
  export function isActiveBoost(
    flower: { boost_start_at: string | null; boost_end_at: string | null }, now = new Date(),
  ): boolean { /* §3.2 규칙 */ }
  export function boostFirst<T extends { isBoosted: boolean }>(
    base: (a: T, b: T) => number,
  ): (a: T, b: T) => number {
    return (a, b) => (a.isBoosted === b.isBoosted ? base(a, b) : a.isBoosted ? -1 : 1);
  }
  ```
  - **RED**: `boost.test.ts` — `isActiveBoost`(활성/예약/만료/null), `boostFirst`(부스트 우선 + 안정성).

### B-3. 매퍼에 isBoosted 주입 (FR-3)
- **수정**: `apps/mobile/src/shared/data/spotMappers.ts` — `toFlowerSpot(row, now=new Date())` 반환 객체에 `isBoosted: isActiveBoost(row.flower, now)` 추가.
  - **RED**: `spotMappers.test.ts`(있으면 추가, 없으면 신규) — 활성 부스트 flower → `isBoosted true`.

### B-4. 홈 TOP 부스트 (FR-5-1) — TDD ⚠️ 호캉스 격리
- **수정**: `apps/mobile/src/shared/data/spotRepository.ts`
  - `getTopSpots(n)`은 **변경 없음**(now_score 순수 유지 → `HocanceTop5Section` 회귀 방지).
  - 신규 `getActiveBoostedSpots(now?)`:
    ```ts
    // 활성 부스트 꽃의 published 명소, now_score desc
    // 1차안: flower:flowers!inner(...) + .lte/.gte('flower.boost_*', kstToday())
    // 2차안(0-2 실패 시): flowers에서 활성 부스트 id 조회 → spots.in('flower_id', ids)
    ```
  - 신규 `getTopSpotsWithBoost(n, now?)`:
    ```ts
    const [top, boosted] = await Promise.all([getTopSpots(n), getActiveBoostedSpots(now)]);
    const seen = new Set<string>(); const merged: FlowerSpot[] = [];
    for (const s of [...boosted, ...top]) { if (!seen.has(s.id)) { seen.add(s.id); merged.push(s); } }
    return merged.sort(boostFirst((a, b) => (b.nowScore ?? -1) - (a.nowScore ?? -1))).slice(0, n);
    ```
  - 새 쿼리 키: `spotKeys.topBoosted = (n) => ['spots','top-boosted', n]`
- **수정**: `apps/mobile/src/features/home/components/TopSpotsSection.tsx` — `queryFn`/`queryKey`를 `getTopSpotsWithBoost`/`spotKeys.topBoosted`로 교체.
- **불변**: `apps/mobile/src/features/home/components/HocanceTop5Section.tsx` — 기존 `getTopSpots` 유지(호텔 랭킹 기준 불변).
- **RED**: `spotRepository.test.ts`에 `getTopSpotsWithBoost`가 부스트 명소를 limit 안으로 끌어올리는지(점수 낮아도 포함) 케이스 추가. `TopSpotsSection.test.tsx`는 새 함수 모킹으로 갱신.

### B-5. 검색 추천순 (FR-5-2)
- **수정**: `apps/mobile/src/features/search/screens/SearchScreen.tsx`
  - `sortSpots`의 `recommended` 분기: `[...list].sort(boostFirst(compareByRecommendation))`
  - `ending` 분기도 `boostFirst(...)`로 감싸 일관성 유지(FR-4-1).

### B-6. 명소목록 (FR-5-3)
- **수정**: `apps/mobile/src/features/map/screens/SpotListScreen.tsx`
  - 기본 표시: `getPublishedSpots`가 `display_order`로 오는 배열을 `[...].sort(boostFirst(() => 0))`로 부스트만 상단 고정(stable이므로 내부 display_order 유지).
  - `sortByEnding` 분기: 기존 종료임박 비교자를 `boostFirst(...)`로 감쌈.

> Phase B 완료 시 커밋: `feat(mobile): 꽃 집중 노출 정렬 반영(홈TOP·검색·목록)`

---

## 테스트 전략

### 자동 테스트 (신규)
| 대상 | 파일 | 검증 |
|---|---|---|
| 스키마 검증 | `flowerSchema.test.ts` | FR-2-3 (4 분기) |
| 어드민 배지 | `boostStatus.test.ts` | FR-2-1/2 (active/scheduled/expired/none + 경계) |
| 판정·정렬(모바일) | `boost.test.ts` | FR-3, FR-4 |
| 홈 TOP 병합 | `spotRepository.test.ts` | FR-5-1 (점수 낮은 부스트 명소 포함) |
| 매퍼 | `spotMappers.test.ts` | FR-3 (isBoosted 주입) |
| 섹션 | `TopSpotsSection.test.tsx` | 부스트 명소 우선 노출 |

### 수동 회귀 체크리스트
- [ ] **NFR-6**: 모든 꽃 boost 미설정 → 홈TOP·검색·목록 순서가 변경 전과 동일
- [ ] **FR-5-1**: 점수 낮은 꽃에 부스트 → 모바일 홈 TOP 상단 노출 + 호캉스 섹션 호텔 추천은 불변
- [ ] **FR-6-1**: 종료일을 과거로 → 다음 조회에서 부스트 해제
- [ ] **FR-2-3**: 어드민에서 한쪽 날짜만/역순 입력 → 저장 거부 메시지
- [ ] **NFR-1**: 모바일 정렬 구현이 공유 패키지에 영향을 주지 않음

---

## 위험 · 완화

| 위험 | 영향 | 완화 |
|---|---|---|
| `getTopSpots` 변경 시 호캉스 호텔 랭킹 회귀 | 중 | `getTopSpots` 불변 유지, 홈 전용 `getTopSpotsWithBoost` 신규(B-4) |
| PostgREST 임베디드 필터 미동작 | 중 | 0-2에서 사전 검증, 실패 시 2-step 조회(B-4 2차안) |
| 시간대 불일치로 만료 경계 오차 | 하 | `kstToday` 단일 함수로 통일(NFR-5), 기존 bloom 경계 규칙 준수 |
| 부스트 그룹 과다 시 점수 화면 왜곡 | 하 | 단일 on/off + 그룹 내 기존 정렬 유지로 영향 국소화 |

---

## 브랜치 · PR 전략

- 브랜치: `feat/flower-boost-exposure`
- 커밋 단위: Phase A → B (각 Phase 말미 커밋). DB 마이그레이션(A-1)을 첫 커밋으로 분리.
- PR 생성 전 `pr-review-process` 스킬(이중 코드리뷰) 수행.

## 멀티에이전트 분담 (구현 단계)

메인 세션 = PM. `multi-agent-workflow` 스킬에 따라:
- **Track A (어드민/DB 개발자)**: Phase A 전체
- **Track B (모바일 개발자)**: Phase B 전체
- 선행 의존: A-1(마이그레이션) → B의 통합 검증. 단, B의 타입·단위 테스트는 A와 병렬 가능.
- 정렬 헬퍼 인터페이스 계약(§공통)을 B가 준수하도록 PM이 계약 고정 후 분배.

---

## 완료 보고 (스펙 ID 충족 매핑)

| 스펙 ID | 충족 산출물 |
|---|---|
| FR-1 | A-1, A-2, A-4, A-5 |
| FR-2 | A-3, A-6 |
| FR-3 | B-2/B-3 |
| FR-4 | B-2(boostFirst) |
| FR-5-1 | B-4 (getTopSpotsWithBoost) |
| FR-5-2 | B-5 |
| FR-5-3 | B-6 |
| FR-6 | §3.2 날짜 도출(배치 없음) + 회귀 체크 |
| NFR-1 | B 자체 구현 (공유 패키지 미사용) |
| NFR-3 | select 확장 재사용 + 홈TOP 보조 쿼리 1회 |
| NFR-4 | cron 미추가 |
| NFR-6 | 회귀 체크리스트 |
