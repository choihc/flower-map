# 명소 등록용 JSON

## 이 파일들이 무엇인가

어드민 Import 콘솔(`apps/web/src/features/import`)에 붙여 넣어 꽃과 명소를 **최초 등록할 때 쓰는 입력 원본**입니다.

**DB의 현재 상태가 아닙니다.** 앱은 Supabase를 읽고, 이 파일들은 런타임에 아무 데서도 읽지 않습니다. 등록한 뒤에 어드민에서 값을 고쳤다면 파일과 DB는 갈라집니다.

남겨두는 이유는 세 가지입니다.

- **재현·복구** — 스테이징 환경을 새로 만들거나 데이터를 다시 넣어야 할 때의 입력
- **다음 시즌 참고** — 새 꽃 데이터를 만들 때 베낄 형식과 문체
- **리뷰** — DB에 직접 INSERT하면 아무도 못 보지만, 파일로 올리면 PR 리뷰가 붙습니다

## 재등록할 때 반드시 확인할 것

### 1. `status`는 항상 `draft`입니다 — DB는 `published`일 수 있습니다

모든 파일이 `draft`로 고정돼 있습니다. 검수 후 어드민에서 일괄 게시(`bulkUpdateSpotStatus`)하는 흐름을 전제로 합니다.

**이미 등록해서 라이브인 명소를 이 파일로 재등록하면 `draft`로 내려갑니다.** import는 slug가 이미 있으면 UPDATE로 처리하기 때문입니다(`apps/web/src/features/import/planImportWrite.ts:44`). 운영 DB에 다시 넣기 전에 현재 status를 먼저 확인하세요.

### 2. 옵션 필드는 값이 없어도 키를 지우지 마세요

`buildSpotWriteInput`(`apps/web/src/lib/data/spots.ts:14`)은 값이 없는 필드를 **명시적으로 `null`로 채워** 통째로 update합니다. 키를 빼면 그 필드가 지워집니다.

```jsonc
// 값이 없으면 이렇게 — 키를 빼면 재등록 때 DB 값이 날아갑니다
"parking_info": null,
"admission_fee": null,
"festival_name": null,
"festival_start_at": null,
"festival_end_at": null,
"thumbnail_url": "https://...",   // 등록 후 채운 썸네일도 여기 남겨둡니다
"source_note": "한국관광공사 TourAPI (공공누리)"
```

특히 `thumbnail_url`을 비워두면 **어드민에서 붙인 사진이 전부 지워집니다.**

## 작성 규칙

### 포맷

최상위가 **단일 객체**여야 합니다. 배열(`[ ... ]`)은 파싱에 실패합니다. 두 가지가 허용됩니다.

| 용도 | 형태 |
|---|---|
| 신규 꽃 + 명소 일괄 | `{ "flower": {...}, "spots": [...] }` |
| 기존 꽃에 명소 단건 | `{ "flower_slug": "lilac", "spot": {...} }` |

스키마는 `apps/web/src/features/import/importSchema.ts`와 `apps/web/src/features/spots/spotSchema.ts`가 정답입니다.

### 필드별 주의

- **`region_primary`** — 6개 광역 묶음만 씁니다: `서울/경기`, `강원`, `충청`, `전라`, `경상`, `제주`
- **`region_secondary`** — "시도약칭 시군구" (예: `전남 순천시`). 앱 홈의 지역 타일이 이 값의 **첫 어절**로 만들어지므로(`spotRepository.ts`의 `toRegionSummary`) `담양`·`북구` 같은 짧은 값을 넣으면 타일이 오염됩니다.
- **`address`** — 시도 정식 명칭으로 시작합니다 (`전라남도`, `강원특별자치도`)
- **`display_order`** — 쓰지 않습니다. `spots` 테이블 **전역** 정렬 컬럼이라 꽃별로 1~N을 부여하면 꽃끼리 값이 겹쳐 동점 행의 순서가 보장되지 않습니다. 노출 순서는 `now_score`에 맡깁니다.
- **`is_featured`** — 꽃당 3~5건을 넘기지 않습니다. 현재 이 값을 읽는 곳은 어드민 명소 목록의 "대표/일반" 배지뿐이고(`apps/web/src/features/spots/SpotsTable.tsx:248`), 모바일 앱은 쓰지 않습니다. `packages/flower-domain`의 `getFeaturedSpots`는 export만 돼 있고 소비하는 앱이 없습니다. 지금은 사용자에게 보이는 동작이 아니라 **꽃끼리 기준을 맞추기 위한 관행**입니다. 나중에 대표 명소를 노출하는 화면이 생기면 이 값이 그대로 쓰이므로 미리 정돈해 둡니다.
- **`flower.aliases`** — **검색 트렌드 조회 키워드로 그대로 쓰입니다**(`apps/web/app/api/cron/now-score/route.ts`의 `buildTrendGroup`). 다른 식물 이름을 넣으면 그 검색량이 `now_score`에 섞입니다. 억새(Miscanthus)에 `갈대`(Phragmites)를 넣었다가 뺀 사례가 있습니다. 같은 꽃의 이명만 넣으세요.
- **`festival_*`** — 일정이 확인된 것만 넣습니다. 이름만 넣으면 상세 화면에 "축제 일정: 일정 미정"이 뜹니다(`spotMappers.ts`의 `formatDateRange`).
- **`source_note`** — 데이터·사진 출처를 남깁니다. 권리 확인이 안 된 사진은 그 사실까지 적어 나중에 교체 대상을 뽑을 수 있게 합니다.

### 꽃이 이미 등록돼 있으면 `flower` 블록은 무시됩니다

`resolveFlowerId`(`apps/web/src/features/import/actions.ts:134`)는 slug가 존재하면 기존 행의 id를 그대로 반환하고, 없을 때만 새로 만듭니다. `aliases`·`color_hex`·`season_*`를 고치려면 어드민 꽃 편집 화면에서 따로 넣어야 합니다.

## 등록 전 체크리스트

- [ ] 최상위가 배열이 아니라 단일 객체인가
- [ ] `slug`가 `^[a-z0-9-]+$`이고 기존 명소와 겹치지 않는가 (같은 장소를 꽃별로 등록하면 꽃 이름을 접미사로: `suncheon-bay-garden-cosmos`)
- [ ] 좌표가 한국 영역 안인가 (위도 33~39 · 경도 124~132)
- [ ] `bloom_start_at <= bloom_end_at`, 축제 날짜도 시작 ≤ 종료이고 쌍으로 있는가
- [ ] `region_primary`가 6개 묶음 중 하나인가
- [ ] 옵션 필드 7종의 키가 전부 있는가
- [ ] `status`가 `draft`인가
