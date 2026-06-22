---
작성일: 2026-06-22
최종 수정일: 2026-06-22
관련 플랜: docs/plans/flower-boost-exposure.md (작성 예정)
---

# 꽃 집중 노출(Boost) 기능 명세

## 1. 개요

### 1.1 정의

**집중 노출(Boost)** 은 어드민이 특정 **꽃(flower)** 에 대해 기간을 지정하여, 해당 기간 동안 그 꽃에 속한 **명소(spot)** 들을 다른 꽃의 명소보다 항상 상위에 노출시키는 기능이다. 기존의 자동 점수(`now_score`)·수동 정렬(`display_order`)과 독립적으로 동작하는 **상위 그룹 고정(pinning)** 메커니즘이다.

### 1.2 도메인 책임

| 책임 | 설명 |
|---|---|
| 집중 노출 설정 | 어드민이 꽃 단위로 집중 노출 시작일/종료일을 지정·해제한다. |
| 활성 부스트 판정 | 조회 시점(오늘 날짜)을 기준으로 각 꽃이 "현재 집중 노출 중"인지 판정한다. |
| 상위 그룹 고정 | 활성 부스트 꽃에 속한 명소를 모든 노출 지점에서 비부스트 명소보다 상위에 배치한다. |
| 자동 만료 | 종료일이 지나면 별도 조작 없이 집중 노출이 자동으로 해제된다. |

### 1.3 해결하는 문제

특정 꽃이 미디어·SNS에서 화제가 되어 노출 수요가 급증했으나, 자동 점수(개화 시기·검색 트렌드 등) 산정상 다른 꽃에 밀려 충분히 노출되지 않는 상황에서, 운영자가 전략적·일시적으로 노출 빈도를 끌어올릴 수 있게 한다.

---

## 2. 용어

| 용어 | 정의 |
|---|---|
| 부스트 기간 | `boost_start_at` ~ `boost_end_at` (양 끝 포함, 일 단위) |
| 활성 부스트(active boost) | 조회 시점 날짜가 부스트 기간 안에 들어 있어 실제로 우선순위가 적용되는 상태 |
| 예약 부스트(scheduled) | 부스트 기간이 설정됐으나 시작일이 아직 도래하지 않은 상태 |
| 만료 부스트(expired) | 종료일이 지나 비활성화된 상태 |
| 부스트 그룹 | 한 노출 지점에서 활성 부스트 꽃에 속한 명소들의 집합 (상단에 배치) |

---

## 3. 데이터 모델

### 3.1 `flowers` 테이블 확장 (FR-1 근거)

기존 `flowers` 테이블에 다음 두 컬럼을 추가한다.

```sql
ALTER TABLE public.flowers
  ADD COLUMN boost_start_at date,   -- 집중 노출 시작일 (nullable)
  ADD COLUMN boost_end_at   date;   -- 집중 노출 종료일 (nullable)
```

- 기본값은 둘 다 `NULL`(집중 노출 미설정).
- 별도 boolean 플래그를 두지 않는다. 활성 여부는 항상 두 날짜와 조회 시점으로 도출(derive)한다. (단일 진실 원천 = 기간)
- 기존 `sort_order`, `is_active` 컬럼은 그대로 유지하며 의미가 바뀌지 않는다. 집중 노출은 이들과 독립적으로 동작한다.

### 3.2 활성 부스트 판정 규칙 (FR-3)

조회 시점 날짜 `today`(KST 기준)에 대해, 꽃 `f`의 활성 부스트 여부 `isBoosted(f, today)`는 다음으로 정의한다.

```
isBoosted(f, today) :=
  f.boost_start_at IS NOT NULL
  AND f.boost_end_at IS NOT NULL
  AND f.boost_start_at <= today
  AND today <= f.boost_end_at
```

- 두 날짜 중 하나라도 `NULL`이면 비활성으로 간주한다(부분 설정 불가, FR-2-3 검증으로 입력 단계에서 차단).
- 시작일 > 오늘 → 예약 상태(비활성). 종료일 < 오늘 → 만료 상태(비활성).
- 별도 배치(cron) 없이 **조회/매핑 시점의 날짜 비교만으로** 활성/만료를 판정한다(NFR-4).

---

## 4. 기능 요구사항 (FR)

### FR-1. 어드민 — 집중 노출 설정

- **FR-1-1** 어드민 꽃 편집 화면(`FlowerForm`)에서 "집중 노출 기간"의 시작일·종료일을 입력할 수 있다.
- **FR-1-2** 두 날짜를 비우고 저장하면 집중 노출이 해제된다(둘 다 `NULL`).
- **FR-1-3** 집중 노출 설정/해제는 기존 꽃 수정 경로(`updateFlower`)를 통해 저장되며, 저장 후 공개 노출에 반영되도록 관련 경로를 재검증(revalidate)한다.

### FR-2. 어드민 — 상태 표시·검증

- **FR-2-1** 꽃 목록 화면에서 각 꽃의 집중 노출 상태를 배지로 표시한다: `집중 노출 중(D-n)` / `예약(MM.DD~)` / `만료` / (없음).
- **FR-2-2** 상태 배지의 "중/예약/만료" 구분은 FR-3 판정 규칙과 동일한 기준(오늘 날짜 대비 기간)을 따른다.
- **FR-2-3** 입력 검증: ① 시작일과 종료일은 **둘 다 입력하거나 둘 다 비워야** 한다(한쪽만 입력 불가). ② `boost_start_at <= boost_end_at` 이어야 한다. 위반 시 저장을 거부하고 사유를 표시한다.

### FR-3. 활성 부스트 판정

- **FR-3-1** §3.2의 `isBoosted` 규칙으로 판정한다.
- **FR-3-2** 판정 기준 날짜는 KST 기준 "오늘"이다(NFR-5).

### FR-4. 노출 정렬 — 상위 그룹 고정 (공통 계약)

- **FR-4-1** 모든 명소 노출 지점에서, 활성 부스트 꽃에 속한 명소(부스트 그룹)는 비부스트 명소보다 **항상 상위**에 배치된다.
- **FR-4-2** 부스트 그룹 **내부**의 상대 순서는 그 화면의 **기존 정렬 기준**(`now_score` 또는 `display_order` 또는 종료 임박순)을 그대로 따른다. 집중 노출은 그룹을 끌어올릴 뿐, 그룹 내부 순서를 바꾸지 않는다.
- **FR-4-3** 비부스트 그룹 내부의 순서도 기존 정렬 기준을 그대로 유지한다.
- **FR-4-4** 여러 꽃이 동시에 활성 부스트인 경우, 부스트 그룹 내부에서 꽃 간 우선순위 구분은 두지 않는다(단일 on/off). 그룹 전체를 화면 기존 기준으로 정렬한다.
- **FR-4-5** 정렬은 안정 정렬(stable)이어야 하며, 부스트 여부를 1차 키, 화면 기존 기준을 2차 키로 적용한 것과 동치여야 한다.

### FR-5. 적용 지점별 동작

집중 노출은 모바일 앱의 노출 지점에 반영한다(적용 범위 = 모바일 앱).

- **FR-5-1 (모바일 홈 TOP)** `getTopSpots(n)` 결과에서, 활성 부스트 꽃의 공개 명소가 **개수 제한(`limit n`)에 의해 누락되지 않도록** 우선 포함된다. 즉 부스트 명소를 먼저 채우고, 남은 자리를 `now_score` 상위 비부스트 명소로 채운 뒤, 전체를 FR-4 계약(부스트 우선 → `now_score` desc)으로 정렬한 결과와 동치여야 한다.
- **FR-5-2 (모바일 검색 추천순)** `compareByRecommendation`이 1차로 부스트 여부, 2차로 `now_score` desc(없으면 후순위)를 따른다.
- **FR-5-3 (모바일 명소목록)** 기본(`display_order`) 및 "종료 임박순" 토글 모두에서 부스트 그룹이 상위에 온다. 부스트 그룹 내부는 각 모드의 기준(display_order / 종료 임박순)을 따른다.

### FR-6. 자동 만료

- **FR-6-1** 종료일(`boost_end_at`)이 지난 꽃은 별도 운영 조작 없이 다음 조회부터 비부스트로 처리된다.
- **FR-6-2** 만료된 부스트 설정 데이터(`boost_start_at`/`boost_end_at` 값)는 자동 삭제하지 않는다. 어드민에서 이력 확인 및 재설정이 가능하도록 보존한다.

---

## 5. 비기능 요구사항 (NFR)

- **NFR-1 (모바일 앱 격리 구현)** 모바일은 자체 `spotRepository`/`spotMappers`로 정렬 계약(FR-4)을 구현한다. 공유 패키지(`flower-domain`/`supabase`)와 독립적으로 동작한다.
- **NFR-2 (공유 패키지 영향 범위)** `packages/flower-domain`·`packages/supabase`는 boost 기능에서 사용하지 않는다(모바일/어드민 자체 코드 사용). `flowers` 테이블 스키마 변경만 DB 차원의 공통 사항이다.
- **NFR-3 (추가 네트워크 비용 최소화)** 부스트 판정에 필요한 정보(`boost_start_at`/`boost_end_at`)는 기존 명소 조회의 `flower` 조인 `select`에 컬럼을 추가해 함께 가져온다. 일반 목록 화면은 추가 쿼리 없이 클라이언트 메모리 정렬로 처리한다. (홈 TOP은 FR-5-1 충족을 위해 보조 쿼리 1회를 허용한다.)
- **NFR-4 (배치 불필요)** 활성/만료 전이는 조회 시점 날짜 비교로 도출하므로, 만료를 위한 별도 cron/스케줄러를 추가하지 않는다.
- **NFR-5 (시간대 일관성)** 활성 부스트 판정의 "오늘"은 KST(Asia/Seoul) 기준 날짜로 일관되게 계산한다. 기존 개화 D-day 계산과 동일한 날짜 경계 규칙을 따른다.
- **NFR-6 (기존 동작 보존)** 집중 노출이 설정되지 않은(모든 꽃 `NULL`) 상태에서는 모든 노출 지점의 정렬 결과가 현행과 동일해야 한다(회귀 없음).
- **NFR-7 (어드민 권한)** 집중 노출 설정 변경은 기존 어드민 권한 체계(`admin_users` 기반) 내에서만 가능하다. 신규 권한·정책을 추가하지 않는다.

---

## 6. 구조 / 데이터 흐름

```
[어드민 웹]
  FlowerForm (시작일/종료일 입력)
      │  flowerSchema 검증 (FR-2-3)
      ▼
  updateFlower() → flowers.boost_start_at / boost_end_at 저장
      │
      ▼ revalidate
┌──────────── DB: flowers(boost_start_at, boost_end_at) ────────────┐
│                                                                    │
│  [모바일 앱]                                                        │
│  spotRepository                                                    │
│    SPOT_SELECT에 boost 컬럼 포함                                    │
│    toFlowerSpot → isBoosted 계산                                   │
│      │                                                             │
│      ▼ 정렬(FR-4)                                                  │
│    홈 TOP / 검색 / 명소목록                                         │
└────────────────────────────────────────────────────────────────┘
```

---

## 7. 타입 / 인터페이스 계약

### 7.1 어드민 (apps/web)

```ts
// FlowerRow 확장 (src/lib/types.ts)
type FlowerRow = {
  // ...기존 필드
  boost_start_at: string | null; // 'YYYY-MM-DD'
  boost_end_at: string | null;   // 'YYYY-MM-DD'
};

// flowerSchema 확장 (src/features/flowers/flowerSchema.ts)
//  - boost_start_at: nullable date 문자열
//  - boost_end_at: nullable date 문자열
//  - refine: (둘 다 null) OR (둘 다 not null AND start <= end)
```

### 7.2 클라이언트 공통 도메인 타입

```ts
// FlowerSpot 확장 (모바일: shared/data/types)
type FlowerSpot = {
  // ...기존 필드
  isBoosted: boolean; // 조회 시점 활성 부스트 여부 (매퍼에서 계산)
};

// 명소 조회 select 확장 (모바일)
//   기존: flower:flowers(name_ko, thumbnail_url[, is_active])
//   변경: flower:flowers(name_ko, thumbnail_url[, is_active], boost_start_at, boost_end_at)

// PublishedSpotRow.flower 확장:
//   flower: { name_ko; thumbnail_url; is_active?; boost_start_at: string|null; boost_end_at: string|null }

// 매퍼 시그니처 (now 주입 가능, 기존과 동일 패턴)
//   toFlowerSpot(row, now=new Date()): FlowerSpot   // isBoosted = isActiveBoost(row.flower, now)
```

### 7.3 정렬 헬퍼 계약

```ts
// 활성 부스트 판정 (모바일 자체 구현)
//   isActiveBoost(flower: { boost_start_at: string|null; boost_end_at: string|null }, now: Date): boolean

// 부스트 우선 비교자 — 화면 기존 비교자(base)를 감싼다
//   boostFirst(base: (a, b) => number): (a: FlowerSpot, b: FlowerSpot) => number
//     1차: isBoosted(true 먼저), 2차: base(a, b)

// 적용 예:
//   검색 추천순: [...list].sort(boostFirst(compareByRecommendation))
//   명소목록 기본: [...list].sort(boostFirst(byDisplayOrder))  // display_order는 조회 시 부여 또는 인덱스 보존
//   명소목록 종료임박: [...list].sort(boostFirst(byEndingSoon))
```

### 7.4 홈 TOP 조회 계약 (FR-5-1)

```ts
// getTopSpots(n): Promise<FlowerSpot[]>
//   - 활성 부스트 꽃의 공개 명소를 누락 없이 포함한다.
//   - 반환 배열은 boostFirst(now_score desc) 순서와 동치다.
//   - 구현 방식(부스트 명소 보조 조회 후 병합 vs 단일 조회 후 메모리 정렬)은 플랜에서 확정.
```

---

## 8. 외부 의존성

- **Supabase PostgreSQL** — `flowers` 테이블 스키마 변경(마이그레이션), 명소 조회 시 `flower` 조인 컬럼 확장.
- **기존 어드민 인증** — `admin_users` 기반 권한(변경 없음).
- 신규 외부 API·라이브러리 의존성 없음.

---

## 9. 명시적 가정

- 노출 우선순위 조정의 단위는 **꽃**이다(명소 단위 `is_featured`와는 독립). 한 꽃을 집중 노출하면 그 꽃의 **모든 공개 명소**가 부스트 그룹에 포함된다.
- 집중 노출은 명소의 공개 여부(`status='published'`)를 바꾸지 않는다. 비공개 명소는 부스트 대상이 아니다.
- 집중 노출은 명소의 개화 종료 여부와 무관하게 적용된다(운영자의 전략적 노출 의도를 우선).
- Supabase가 `date` 컬럼을 `'YYYY-MM-DD'` 문자열로 반환한다고 가정한다(기존 `bloom_start_at` 처리와 동일).

---

## 10. 범위 외 (Out of Scope)

- 꽃 간 부스트 우선순위(가중치·레벨) — 단일 on/off로 확정(향후 확장 여지).
- 명소 단위 개별 부스트 — 본 기능은 꽃 단위.
- 부스트 노출 성과(클릭·전환) 측정·리포팅.
- 부스트 설정 변경 이력(audit log) 적재.
- 푸시 알림·홈 큐레이션(`home_curation`)과의 연동.
- 토스 미니앱: 프로젝트가 삭제되어 본 기능의 적용 대상이 아니다.
