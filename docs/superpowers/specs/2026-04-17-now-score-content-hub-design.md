# "지금 지수" + 자동 콘텐츠 허브 설계

## 1. 목표

꽃어디 앱에 두 가지 기능을 도입해 "지금 가볼만한 명소"라는 시간·상황 민감한 가치를 자동으로 제공한다.

핵심 목표:
- 명소마다 "지금 지수(Now Score)"를 매일 자동 산출해, 홈·지도·검색 결과 정렬의 기본 신호로 사용한다.
- 각 명소 상세 페이지에 해당 명소를 다룬 유튜브 영상과 네이버 블로그 글을 자동 수집해 보여준다.
- 운영자 수동 개입이 거의 필요 없도록, 전 과정을 외부 공개 API와 주기 배치로 자동화한다.

## 2. 범위

### 포함
- 명소별 "지금 지수" 계산 배치 및 정렬 반영
- 명소 상세 "이 명소 이야기" 섹션(유튜브·블로그 카드)
- Vercel Cron 기반 배치 스케줄링
- 기상청 단기예보·네이버 검색·네이버 데이터랩·유튜브 Data API v3 통합
- 유의어·제외어 등 운영자 튜닝 수단
- 점수·콘텐츠 데이터를 저장할 Supabase 스키마 확장

### 제외
- 푸시 알림을 활용한 적극적 재방문 유도 (옵트인 개화 시작 1회 알림은 기존 알림 설계 재사용, 본 스펙에서는 신규 추가 없음)
- 사용자 제보·리뷰·사진 업로드 같은 능동적 UGC 기능
- LLM을 활용한 콘텐츠 품질 판정 (쿼리와 휴리스틱 규칙으로만 필터링)
- 주변 맛집, 교통, 숙박 등 인접 서비스 정보 통합
- 관리자 화면에서의 점수 수동 조정 UI (v1은 설정 플래그 수준에서만 제공)

## 3. 시스템 구조

### 3.1 데이터 흐름

```text
[Vercel Cron]
  ├─ daily now-score job  ─────┐
  └─ weekly content-sync job ──┤
                               ▼
     [apps/web /api/cron/*]  ── 외부 API 호출
                               ├─ 기상청 단기예보
                               ├─ 네이버 데이터랩 검색어 트렌드
                               ├─ 네이버 검색 (블로그)
                               └─ 유튜브 Data API v3
                               ▼
               [Supabase 테이블에 결과 저장]
                 spots.now_score 등 점수 컬럼
                 spot_videos / spot_blogs 신규 테이블
                               ▼
   [apps/mobile, apps/toss-mini, apps/web 공개 페이지]
      Supabase anon key로 조회만 수행 (외부 API 직접 호출 없음)
```

### 3.2 책임 분리

- `apps/web` (Next.js, Vercel)
  - 모든 외부 API 비밀 키 소유 주체
  - `/api/cron/*` 라우트에서 배치 실행
  - 점수·콘텐츠 데이터를 Supabase로 쓰기
- Supabase
  - 데이터 저장소 역할만. Edge Function·`pg_cron` 사용하지 않음
- 모바일 앱 (`apps/mobile`, `apps/toss-mini`)
  - Supabase anon key로 읽기만. 외부 API 직접 호출하지 않음
  - 네이버·유튜브·기상청 키를 번들에 포함하지 않음

## 4. 데이터 모델

### 4.1 `spots` 테이블 확장

```sql
ALTER TABLE spots
  ADD COLUMN bloom_score     NUMERIC(5,2),    -- 0~100, 개화 진행률 기반
  ADD COLUMN trend_score     NUMERIC(5,2),    -- 0~100, 검색 트렌드
  ADD COLUMN content_score   NUMERIC(5,2),    -- 0~100, 최근 콘텐츠 발행량
  ADD COLUMN yoy_score       NUMERIC(5,2),    -- 0~100, 작년 대비 증가율
  ADD COLUMN now_score       NUMERIC(5,2),    -- 0~100, 위 네 개의 가중합
  ADD COLUMN now_score_at    TIMESTAMPTZ,     -- 마지막 계산 시각
  ADD COLUMN exclude_keywords TEXT[];         -- 콘텐츠 수집 시 제외할 키워드
```

### 4.2 `flowers` 테이블 확장

```sql
ALTER TABLE flowers
  ADD COLUMN aliases TEXT[];                  -- 유의어 (예: 벚꽃 → ['왕벚나무','cherry blossom'])
```

### 4.3 신규 테이블 `spot_videos`

```sql
CREATE TABLE spot_videos (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id          UUID NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  video_id         TEXT NOT NULL,              -- YouTube video ID
  title            TEXT NOT NULL,
  channel_title    TEXT,
  thumbnail_url    TEXT,
  published_at     TIMESTAMPTZ,
  view_count       INTEGER,
  relevance_score  NUMERIC(3,2),               -- 0~1, 휴리스틱 관련도
  fetched_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (spot_id, video_id)
);
CREATE INDEX ON spot_videos (spot_id, relevance_score DESC, published_at DESC);
```

### 4.4 신규 테이블 `spot_blogs`

```sql
CREATE TABLE spot_blogs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id          UUID NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  url              TEXT NOT NULL,
  title            TEXT NOT NULL,
  description      TEXT,
  blogger_name     TEXT,
  posted_at        TIMESTAMPTZ,
  relevance_score  NUMERIC(3,2),
  fetched_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (spot_id, url)
);
CREATE INDEX ON spot_blogs (spot_id, relevance_score DESC, posted_at DESC);
```

### 4.5 RLS 정책

- `spot_videos`, `spot_blogs`: anon 읽기 허용, 쓰기 금지
- `spots`의 새 컬럼: 기존 `spots`의 anon 읽기 정책에 포함

## 5. "지금 지수(Now Score)" 산출

### 5.1 구성 요소와 가중치

서버 배치에서 계산해 `now_score`에 저장한다. 접근 용이성(거리)은 사용자 위치 의존이라 클라이언트에서 `now_score` 위에 곱해 사용한다.

| 구성요소 | 가중치 | 컬럼 |
|---------|-------|------|
| 개화 진행률 | 47% | `bloom_score` |
| 검색 트렌드 | 29% | `trend_score` |
| 콘텐츠 발행량 | 18% | `content_score` |
| 연례 대비 증가율 | 6% | `yoy_score` |

```
now_score = 0.47*bloom_score + 0.29*trend_score + 0.18*content_score + 0.06*yoy_score
```

가중치는 `apps/web/src/lib/now-score/weights.ts` 상수로 노출해 튜닝 시 한 곳만 수정하면 되도록 한다.

### 5.2 개화 진행률 (`bloom_score`)

시간 기반 삼각 분포를 기본으로, 기상 보정을 덧붙인다.

기본 곡선:
- 개화 시작 전 30일~시작일: 0 → 30 선형 증가 ("예정" 구간)
- 개화 시작일 → 기간 중간: 30 → 100 선형 증가
- 기간 중간 → 종료일: 100 → 30 선형 감소
- 종료 후 14일: 30 → 0 선형 감소

기상 보정 (기상청 단기예보):
- 최근 3일 평균 기온이 평년 대비 ±3°C 이상 차이 시, 개화 시작·종료일 추정값을 ±2일 평행 이동
- 최근 7일 누적 강수량이 80mm 초과 시 `bloom_score`에 -10% 감산(꽃잎 낙화 가중)

평년 기온은 기상청 외에 지역별 고정 상수 표로 대신할 수 있다 (v1은 전국 평균 한 개 값 사용, 이후 지역별 확장).

### 5.3 검색 트렌드 (`trend_score`)

네이버 데이터랩 검색어 트렌드 API 사용.

- 검색어 그룹: 명소명 단독 + 명소명+꽃이름 조합 2개를 한 그룹으로 묶어 호출
- 비교 기간: 최근 7일 vs 이전 7일
- 원시 지수는 최대 100 기준이므로, 최근 7일 평균 검색 지수를 그대로 `trend_score`로 사용
- API 호출 효율: 데이터랩 API는 한 요청에 최대 5개 그룹 비교 가능 → 명소 5개씩 묶어 호출

### 5.4 콘텐츠 발행량 (`content_score`)

- 네이버 블로그 검색 API: `query = "{명소명} {꽃이름}"`, `sort=date`, 최근 7일 내 글 수 카운트
- 유튜브 Data API v3: `search.list`로 같은 쿼리, `publishedAfter=지난 7일`, 결과 수 카운트
- 두 수치를 정규화해 합산:
  - 블로그 글 수 `b`: `min(1, b/30) * 100 * 0.6`
  - 유튜브 영상 수 `v`: `min(1, v/10) * 100 * 0.4`
- 단, 유튜브 `search.list`는 호출당 100 units 소모. 콘텐츠 발행량은 **콘텐츠 허브 주간 배치와 동일 호출을 공유**해 추가 비용 없이 계산 (7.3 참고).

### 5.5 연례 대비 증가율 (`yoy_score`)

- 데이터랩 검색 트렌드 API에서 "최근 7일" 대비 "작년 같은 7일" 지수 비교
- `ratio = recent / last_year`
- `yoy_score = clamp((ratio - 1) * 50, -50, 50) + 50`
  - 작년과 동일: 50점
  - 작년의 2배: 100점
  - 작년의 0.5배: 25점

### 5.6 최종 점수 범위와 정규화

- 각 sub-score는 0~100 범위
- `now_score`도 0~100 범위 (가중합 자체가 이 범위)
- NULL 처리: 한 sub-score가 계산 실패하면 해당 요소는 가중치 재분배 없이 0으로 간주하고, `now_score` 뒤에 `stale`/`partial` 플래그를 별도 컬럼으로 남기지 않고 `now_score_at`의 시각으로만 건강 상태를 식별한다.

### 5.7 클라이언트 거리 가중치

- 기본 정렬은 `now_score DESC`
- "내 주변" 탭에서만 `displayScore = now_score * distanceFactor(d)`
  - `distanceFactor(d) = max(0.5, 1 - d/100km)` (선형 감산, 100km 이상은 0.5로 바닥)

## 6. 자동 콘텐츠 허브

### 6.1 수집 대상

- 명소당 유튜브 영상 최대 3개, 블로그 글 최대 5개
- 명소 상세 페이지 하단 "이 명소 이야기" 섹션에 표시

### 6.2 유튜브 수집

- API: YouTube Data API v3 `search.list`
- 파라미터:
  - `q = "{명소명} {꽃이름}"` (따옴표 포함, 완전 일치 우선)
  - `type = video`
  - `order = relevance`
  - `regionCode = KR`
  - `relevanceLanguage = ko`
  - `publishedAfter = 지난 180일`
  - `videoDuration = medium`
  - `maxResults = 20`
- 후처리:
  - 제목 또는 설명에 명소명 **반드시 포함** (포함 안 되면 제거)
  - 조회수 1,000 미만 제거
  - 같은 `channelId`는 상위 1개만
  - 제목에 꽃이름(또는 `flowers.aliases`) 포함 시 `relevance_score` +0.2 가산
  - 최대 3개 유지

### 6.3 블로그 수집

- API: 네이버 검색 API (블로그)
- 호출 2회 후 병합:
  - `sort=sim`, `display=20` (관련도)
  - `sort=date`, `display=20` (최신)
- 후처리:
  - 제목에서 HTML 태그 제거 후 명소명 포함 여부 확인 — 포함 안 되면 제거
  - 동일 `bloggerlink` 중복 제거
  - 12개월 이내 포스트만
  - 꽃이름/유의어 포함 시 `relevance_score` 가산
  - 최대 5개 유지

### 6.4 제외 키워드

- `spots.exclude_keywords`에 운영자가 지정한 문자열을 포함하는 결과는 제거
- 예: 명소명이 일반 지명과 겹쳐 무관 콘텐츠 유입 시 여기에 키워드를 추가

## 7. 외부 API 연동

### 7.1 사용 API

| 용도 | API | 비용 | 일일 한도 |
|-----|-----|-----|---------|
| 단기 기온·강수 | 기상청 단기예보 조회서비스 (공공데이터포털) | 무료 | 10,000건 |
| 검색 트렌드·연례 비교 | 네이버 데이터랩 검색어트렌드 | 무료 | 1,000건/일 |
| 블로그 수집·발행량 | 네이버 검색 (블로그) | 무료 | 25,000건/일 |
| 유튜브 영상 수집·발행량 | YouTube Data API v3 | 무료 | 10,000 units/일 |

### 7.2 환경 변수 (Vercel)

`apps/web/.env.local` (로컬) 및 Vercel 대시보드 (프로덕션):

```
NAVER_CLIENT_ID=...
NAVER_CLIENT_SECRET=...
YOUTUBE_API_KEY=...
KMA_SERVICE_KEY=...
CRON_SECRET=...           # Vercel Cron 엔드포인트 인증용 임의 문자열
SUPABASE_SERVICE_ROLE_KEY=...   # 배치가 Supabase 쓰기 위해 필요
```

**클라이언트 번들 유입 금지**: `NEXT_PUBLIC_` 프리픽스를 절대 붙이지 않는다. 모바일 앱(`apps/mobile`, `apps/toss-mini`)에는 이 키들을 복사하지 않는다.

### 7.3 쿼터 전략

- 유튜브 Data API는 `search.list` 1회 호출당 100 units → 일 10,000 units로는 **최대 100회 검색**. 명소가 100개 초과하면 주간 배치를 요일별 샤드로 분할:
  - `shard = hash(spot_id) % 7`
  - 월=0, 화=1, … 일=6
- 네이버 데이터랩은 요청당 5개 키워드 그룹 동시 비교로 호출 수 1/5 절감
- 한 배치 실행에서 유튜브 검색 결과를 **콘텐츠 수집(6.2)과 콘텐츠 발행량 계산(5.4)**이 공유 → 호출 1회로 두 목적 동시 달성

### 7.4 장애 대응

- 외부 API 호출 실패 시 해당 명소의 해당 sub-score만 건너뛰고 다른 sub-score는 정상 저장
- 5xx·타임아웃은 한 요청당 최대 2회 재시도, 400번대는 즉시 포기하고 로그만 남김
- 배치 전체 실패 시 `now_score_at`이 갱신되지 않으므로 이전 값이 유지됨 → UX 영향 없음
- Sentry로 배치 함수 에러 리포팅 (기존 Sentry 설정 재사용)

## 8. 배치 스케줄링 (Vercel Cron)

### 8.1 스케줄

- `POST /api/cron/now-score`: 매일 06:00 KST (21:00 UTC 전날)
- `POST /api/cron/content-sync`: 매일 03:00 KST — 샤드 분할로 주간 전체 순회

`vercel.json`:

```json
{
  "crons": [
    { "path": "/api/cron/now-score", "schedule": "0 21 * * *" },
    { "path": "/api/cron/content-sync", "schedule": "0 18 * * *" }
  ]
}
```

### 8.2 엔드포인트 보호

- 모든 `/api/cron/*`는 요청 헤더 `Authorization: Bearer $CRON_SECRET` 검증
- Vercel Cron은 이 헤더를 자동 주입 → 외부 호출 차단

### 8.3 실행 시간 제한

- Vercel Pro 플랜 기준 함수 최대 실행 60s (설정 시 최대 300s)
- `export const maxDuration = 300` 명시
- 명소 수가 많아질 경우를 대비해 쿼리 결과를 스트리밍 방식으로 순회하고 한 명소당 처리 후 바로 DB 커밋

## 9. UI 표시 (모바일·웹 공통 규칙)

### 9.1 홈 화면

- 최상단 "오늘의 TOP 10" 섹션 — `now_score DESC` 상위 10개
- 카드에 점수 구간별 배지:
  - `bloom_score ≥ 80` → 🌸 "만개 절정"
  - `trend_score ≥ 70` → 🔥 "지금 화제"
  - `yoy_score ≥ 70` → 📈 "작년보다 ↑"
- 배지 임계값은 `apps/web/src/lib/now-score/badge.ts`에 상수로 분리

### 9.2 지도 화면

- 마커 크기·색상을 `now_score` 구간별로 3단계 차등
- 클러스터 내 대표 명소 선정 기준도 `now_score`로 변경

### 9.3 검색 결과

- 기존 정렬 옵션(거리/이름)에 "추천순" 추가, 기본값으로 설정
- "추천순" = `now_score DESC`

### 9.4 명소 상세

- 기존 레이아웃 하단에 "이 명소 이야기" 섹션 추가
  - 유튜브 영상 3개 (썸네일, 제목, 채널) — 탭 시 유튜브 앱/웹 열기
  - 블로그 글 5개 (제목, 블로거명, 발행일) — 탭 시 원글 열기
- 섹션 내 콘텐츠가 0개일 경우 섹션 자체 숨김

## 10. 운영 자동화

### 10.1 운영자가 해야 할 일 (최소)

- 신규 명소 등록 시 관리자 화면에서 `flowers.aliases`, `exclude_keywords` 필요하면 채워주기 (필수 아님, 미지정 시 기본 동작)
- API 키 만료/쿼터 초과 시 Sentry 알림 보고 재발급

### 10.2 완전 자동으로 돌아가는 것

- 하루 1회 모든 명소 점수 재계산
- 주 1회 모든 명소 콘텐츠 재수집
- 신규 명소가 DB에 추가되면 다음 배치부터 자동 포함

### 10.3 튜닝 수단

- 가중치: `apps/web/src/lib/now-score/weights.ts` 상수 수정 → 다음 배치부터 반영
- 배지 임계값: `apps/web/src/lib/now-score/badge.ts`
- 콘텐츠 필터 임계값(최소 조회수 등): `apps/web/src/lib/content-hub/filters.ts`

## 11. 엣지 케이스 및 Fallback

| 상황 | 처리 |
|-----|-----|
| 외부 언급이 0인 소규모 명소 | `trend_score = 0`, `content_score = 0` → `bloom_score` 단독으로 정렬됨 |
| 개화 기간 정보(`bloomStartAt/EndAt`) 없는 명소 | `bloom_score = NULL` 처리, 정렬 시 마지막 순위. 관리자에게 Sentry 경고로 알림 |
| 신규 명소(배치 미실행 상태) | `now_score = NULL` → 기본 정렬에서 제외, 카드에서는 "곧 추천 등장" 같은 placeholder로 표시 |
| 명소명이 일반어여서 무관 콘텐츠 대량 유입 | `exclude_keywords` 운영자가 추가 |
| 전체 배치 실패 | 이전 값 유지. 하루 건너뛰어도 사용자 체감은 없음 |
| API 쿼터 초과 | 해당 배치 중단, 다음 스케줄에서 재개 |

## 12. 보안

- 서버 비밀 키는 **`apps/web` 외부에 복사하지 않는다.** 모바일 앱 빌드 산출물에 포함되지 않아야 함
- `NEXT_PUBLIC_*` 프리픽스 금지
- Vercel 크론 엔드포인트는 `CRON_SECRET` Bearer 검증
- Supabase `service_role` 키도 `apps/web` 서버 측에만 존재
- 점수 컬럼·콘텐츠 테이블은 RLS로 anon 읽기만 허용

## 13. 롤아웃

### 13.1 v1 범위

1. 스키마 마이그레이션 (4장)
2. 외부 API 어댑터 (기상청, 데이터랩, 네이버 검색, 유튜브)
3. `now-score` 배치 함수
4. `content-sync` 배치 함수
5. `vercel.json` 크론 등록
6. 홈·지도·검색 정렬 반영, 배지 UI
7. 명소 상세 "이 명소 이야기" 섹션
8. 관리자 화면에 `exclude_keywords`, `aliases` 편집 UI (간단 텍스트 입력)

### 13.2 v1 제외(후속 과제)

- 지역별 평년 기온 세분화
- Growing Degree Days 기반 정밀 개화 예측
- 사용자별 개인화(자주 본 꽃, 저장 명소 가중)
- 관리자용 점수 A/B 대시보드
- 네이버 인스타·X 연동 (공식 API 제약)

## 14. 제약 사항 (UX 원칙)

다음 두 원칙을 본 설계의 모든 UX 결정에서 우선한다.

- **푸시 의존 최소**: 본 기능은 전부 "앱을 열었을 때 자연 노출"로 가치를 전달한다. 푸시는 기존 옵트인 "관심 명소 개화 시작 1회" 외에는 새로 추가하지 않는다.
- **UGC 요구 0**: 사용자가 능동적으로 사진·리뷰를 올리게 요구하지 않는다. 모든 시그널은 외부 공개 데이터와 배치 자동 수집으로만 확보한다.
