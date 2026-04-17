# "지금 지수" + 자동 콘텐츠 허브 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 명소별 "지금 지수(Now Score)"를 매일 자동 산출하고, 명소 상세에 유튜브·블로그 카드를 자동 수집해 표시해, 푸시·UGC에 의존하지 않는 자동 운영형 가치 전달을 구축한다.

**Architecture:** Supabase를 데이터 저장소로 두고, `apps/web`(Vercel)의 Next.js API 라우트 + Vercel Cron에서 외부 API(기상청·네이버 데이터랩·네이버 검색·유튜브)를 호출해 점수·콘텐츠를 채운다. 모바일 앱(`apps/mobile`)과 웹 공개 페이지는 anon key로 Supabase에서 결과만 읽어 표시한다.

**Tech Stack:** Next.js App Router, Supabase(PostgreSQL + RLS), Vercel Cron, Vitest, TypeScript, React Native/Expo

**Spec:** `docs/superpowers/specs/2026-04-17-now-score-content-hub-design.md`

---

## File Structure

### 생성 (apps/web)
- `apps/web/src/lib/external/kma.ts` + `.test.ts` — 기상청 단기예보 어댑터
- `apps/web/src/lib/external/naverDatalab.ts` + `.test.ts` — 검색어 트렌드
- `apps/web/src/lib/external/naverSearch.ts` + `.test.ts` — 블로그 검색
- `apps/web/src/lib/external/youtube.ts` + `.test.ts` — YouTube Data API
- `apps/web/src/lib/now-score/weights.ts` — 가중치 상수
- `apps/web/src/lib/now-score/bloom.ts` + `.test.ts`
- `apps/web/src/lib/now-score/trend.ts` + `.test.ts`
- `apps/web/src/lib/now-score/content.ts` + `.test.ts`
- `apps/web/src/lib/now-score/yoy.ts` + `.test.ts`
- `apps/web/src/lib/now-score/aggregate.ts` + `.test.ts`
- `apps/web/src/lib/now-score/badge.ts` + `.test.ts`
- `apps/web/src/lib/content-hub/filters.ts` + `.test.ts`
- `apps/web/src/lib/cron/auth.ts` + `.test.ts` — `CRON_SECRET` 검증
- `apps/web/src/lib/cron/shard.ts` + `.test.ts` — 해시 샤딩
- `apps/web/app/api/cron/now-score/route.ts` + `.test.ts`
- `apps/web/app/api/cron/content-sync/route.ts` + `.test.ts`
- `supabase/migrations/20260417_now_score_columns.sql`
- `supabase/migrations/20260417_spot_videos.sql`
- `supabase/migrations/20260417_spot_blogs.sql`
- `supabase/migrations/20260417_flower_aliases.sql`
- `supabase/migrations/20260417_spot_exclude_keywords.sql`

### 수정 (apps/web)
- `apps/web/vercel.json` — `crons` 필드 추가 (없으면 생성)
- `apps/web/.env.example` — 신규 환경변수 키 이름 문서화

### 수정 (apps/mobile)
- `apps/mobile/src/shared/data/types.ts` — 점수 필드 + 비디오/블로그 타입 추가
- `apps/mobile/src/shared/data/spotMappers.ts` + `.test.ts` — 점수 필드 매핑 + 비디오/블로그 매퍼
- `apps/mobile/src/shared/data/spotRepository.ts` + `.test.ts` — `getTopSpots()`, `getSpotContent(slug)` 추가
- `apps/mobile/src/features/home/*` — "오늘의 TOP 10" 섹션
- `apps/mobile/src/features/map/*` — 마커 차등 스타일
- `apps/mobile/src/features/search/*` — "추천순" 정렬 추가
- `apps/mobile/src/features/spot/*` — "이 명소 이야기" 섹션

### 생성 (apps/mobile)
- `apps/mobile/src/shared/ui/NowScoreBadges.tsx` + `.test.tsx`
- `apps/mobile/src/features/spot/SpotStoriesSection.tsx` + `.test.tsx`

### 수정 (apps/web 공개 페이지)
- `apps/web/app/(public)/page.tsx` — 홈 TOP 10 반영
- `apps/web/app/(public)/map/page.tsx` — 마커 차등
- `apps/web/app/(public)/search/page.tsx` — 추천순 정렬
- `apps/web/app/(public)/spot/[slug]/page.tsx` — "이 명소 이야기"

### 수정 (apps/web 관리자)
- `apps/web/app/admin/flowers/page.tsx` — `aliases` 편집 필드
- `apps/web/app/admin/spots/[id]/page.tsx` — `exclude_keywords` 편집 필드

---

## Chunk 1: 데이터베이스 스키마 확장

각 마이그레이션은 단일 책임을 가지고, 롤백이 가능하도록 컬럼·테이블을 독립 파일로 분리한다.

### Task 1.1: `spots` 테이블에 점수 컬럼 추가

**Files:**
- Create: `supabase/migrations/20260417_now_score_columns.sql`

- [ ] **Step 1: 마이그레이션 SQL 작성**

```sql
-- 20260417_now_score_columns.sql
ALTER TABLE spots
  ADD COLUMN bloom_score   NUMERIC(5,2),
  ADD COLUMN trend_score   NUMERIC(5,2),
  ADD COLUMN content_score NUMERIC(5,2),
  ADD COLUMN yoy_score     NUMERIC(5,2),
  ADD COLUMN now_score     NUMERIC(5,2),
  ADD COLUMN now_score_at  TIMESTAMPTZ;

CREATE INDEX spots_now_score_idx ON spots (now_score DESC NULLS LAST) WHERE now_score IS NOT NULL;
```

- [ ] **Step 2: 마이그레이션 적용**

```bash
pnpm --dir supabase db push
```
Expected: "Finished supabase db push" 출력

- [ ] **Step 3: 커밋**

```bash
git add supabase/migrations/20260417_now_score_columns.sql
git commit -m "feat(db): spots 테이블에 now_score 계열 컬럼 추가"
```

### Task 1.2: `spot_videos` 테이블 생성

**Files:**
- Create: `supabase/migrations/20260417_spot_videos.sql`

- [ ] **Step 1: SQL 작성**

```sql
-- 20260417_spot_videos.sql
CREATE TABLE spot_videos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id         UUID NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  video_id        TEXT NOT NULL,
  title           TEXT NOT NULL,
  channel_title   TEXT,
  thumbnail_url   TEXT,
  published_at    TIMESTAMPTZ,
  view_count      INTEGER,
  relevance_score NUMERIC(3,2),
  fetched_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (spot_id, video_id)
);
CREATE INDEX spot_videos_spot_rel_idx
  ON spot_videos (spot_id, relevance_score DESC, published_at DESC);

ALTER TABLE spot_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "spot_videos_anon_read" ON spot_videos FOR SELECT USING (true);
```

- [ ] **Step 2: 적용 + 커밋**

```bash
pnpm --dir supabase db push
git add supabase/migrations/20260417_spot_videos.sql
git commit -m "feat(db): spot_videos 테이블 및 anon 읽기 RLS 추가"
```

### Task 1.3: `spot_blogs` 테이블 생성

**Files:**
- Create: `supabase/migrations/20260417_spot_blogs.sql`

- [ ] **Step 1: SQL 작성**

```sql
-- 20260417_spot_blogs.sql
CREATE TABLE spot_blogs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id         UUID NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  url             TEXT NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  blogger_name    TEXT,
  posted_at       TIMESTAMPTZ,
  relevance_score NUMERIC(3,2),
  fetched_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (spot_id, url)
);
CREATE INDEX spot_blogs_spot_rel_idx
  ON spot_blogs (spot_id, relevance_score DESC, posted_at DESC);

ALTER TABLE spot_blogs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "spot_blogs_anon_read" ON spot_blogs FOR SELECT USING (true);
```

- [ ] **Step 2: 적용 + 커밋**

```bash
pnpm --dir supabase db push
git add supabase/migrations/20260417_spot_blogs.sql
git commit -m "feat(db): spot_blogs 테이블 및 anon 읽기 RLS 추가"
```

### Task 1.4: `flowers.aliases` 컬럼 추가

**Files:**
- Create: `supabase/migrations/20260417_flower_aliases.sql`

- [ ] **Step 1: SQL 작성 + 적용 + 커밋**

```sql
ALTER TABLE flowers ADD COLUMN aliases TEXT[] DEFAULT '{}';
```

```bash
pnpm --dir supabase db push
git add supabase/migrations/20260417_flower_aliases.sql
git commit -m "feat(db): flowers.aliases 유의어 배열 컬럼 추가"
```

### Task 1.5: `spots.exclude_keywords` 컬럼 추가

**Files:**
- Create: `supabase/migrations/20260417_spot_exclude_keywords.sql`

- [ ] **Step 1: SQL 작성 + 적용 + 커밋**

```sql
ALTER TABLE spots ADD COLUMN exclude_keywords TEXT[] DEFAULT '{}';
```

```bash
pnpm --dir supabase db push
git add supabase/migrations/20260417_spot_exclude_keywords.sql
git commit -m "feat(db): spots.exclude_keywords 컬럼 추가"
```

### Task 1.6: Supabase 타입 재생성 (두 앱)

- [ ] **Step 1: 타입 생성**

```bash
pnpm --dir supabase gen:types
```

- [ ] **Step 2: 생성된 타입 diff 확인 + 커밋**

Expected 변경: `spots`에 신규 컬럼 5+1, `flowers.aliases`, `spot_videos`/`spot_blogs` 테이블 타입 추가.

```bash
git add apps/web/src/lib/database.types.ts apps/mobile/src/shared/data/database.types.ts packages/supabase/**/*.ts
git commit -m "chore: now_score/콘텐츠 테이블 반영 타입 재생성"
```

---

## Chunk 2: 외부 API 어댑터

`apps/web/src/lib/external/` 하위에 4개 순수 함수 모듈로 구성. 각각 fetch 결과를 좁은 타입으로 반환하고, 모든 비즈니스 로직은 호출 측에 둔다. 테스트는 `fetch`를 모킹해 네트워크 없이 실행.

### Task 2.1: 기상청 단기예보 어댑터

**Files:**
- Create: `apps/web/src/lib/external/kma.ts`
- Create: `apps/web/src/lib/external/kma.test.ts`

- [ ] **Step 1: 실패 테스트 작성 — 기본 호출이 응답을 파싱한다**

```ts
// kma.test.ts
import { describe, it, expect, vi } from 'vitest';
import { fetchShortForecast } from './kma';

describe('fetchShortForecast', () => {
  it('기온과 강수량을 지역별로 반환한다', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({
        response: {
          body: { items: { item: [
            { category: 'TMP', fcstValue: '15' },
            { category: 'PCP', fcstValue: '1.5' }
          ]}}
        }
      })
    })));
    const res = await fetchShortForecast({ nx: 60, ny: 127, serviceKey: 'k' });
    expect(res.tempC).toBe(15);
    expect(res.precipitationMm).toBe(1.5);
  });
});
```

- [ ] **Step 2: 실행 → 실패 확인**

```bash
pnpm --dir apps/web test -- src/lib/external/kma.test.ts
```
Expected: FAIL (`kma` 모듈 없음)

- [ ] **Step 3: 최소 구현**

```ts
// kma.ts
export interface ShortForecastResult {
  tempC: number | null;
  precipitationMm: number | null;
}

export async function fetchShortForecast(args: {
  nx: number; ny: number; serviceKey: string;
}): Promise<ShortForecastResult> {
  const baseDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const url = new URL('https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst');
  url.searchParams.set('serviceKey', args.serviceKey);
  url.searchParams.set('pageNo', '1');
  url.searchParams.set('numOfRows', '100');
  url.searchParams.set('dataType', 'JSON');
  url.searchParams.set('base_date', baseDate);
  url.searchParams.set('base_time', '0500');
  url.searchParams.set('nx', String(args.nx));
  url.searchParams.set('ny', String(args.ny));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`KMA ${res.status}`);
  const json = await res.json();
  const items = json.response?.body?.items?.item ?? [];
  const tmp = items.find((i: any) => i.category === 'TMP');
  const pcp = items.find((i: any) => i.category === 'PCP');
  return {
    tempC: tmp ? Number(tmp.fcstValue) : null,
    precipitationMm: pcp ? (pcp.fcstValue === '강수없음' ? 0 : Number(pcp.fcstValue)) : null,
  };
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
pnpm --dir apps/web test -- src/lib/external/kma.test.ts
```
Expected: PASS

- [ ] **Step 5: 추가 테스트 — 에러 케이스**

"강수없음" 문자열 → 0 반환, 5xx → throw, 빈 items → null 반환. 각 케이스를 별도 `it` 블록으로 추가하고 PASS 확인.

- [ ] **Step 6: 커밋**

```bash
git add apps/web/src/lib/external/kma.ts apps/web/src/lib/external/kma.test.ts
git commit -m "feat(external): 기상청 단기예보 어댑터 추가"
```

### Task 2.2: 네이버 데이터랩 검색어 트렌드 어댑터

**Files:**
- Create: `apps/web/src/lib/external/naverDatalab.ts` + `.test.ts`

- [ ] **Step 1: 인터페이스 정의 후 실패 테스트 작성**

```ts
// naverDatalab.test.ts
import { describe, it, expect, vi } from 'vitest';
import { fetchSearchTrends } from './naverDatalab';

describe('fetchSearchTrends', () => {
  it('최근/이전 구간 평균 지수를 그룹별로 반환한다', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({
        results: [{
          title: '여의도벚꽃',
          data: [
            { period: '2026-04-03', ratio: 30 },
            { period: '2026-04-10', ratio: 70 },
          ],
        }],
      }),
    })));
    const r = await fetchSearchTrends({
      clientId: 'x', clientSecret: 'y',
      startDate: '2026-04-03', endDate: '2026-04-17',
      groups: [{ groupName: '여의도벚꽃', keywords: ['여의도 벚꽃'] }],
    });
    expect(r[0].groupName).toBe('여의도벚꽃');
    expect(r[0].data.length).toBe(2);
  });
});
```

- [ ] **Step 2: 실패 확인 → 구현 → 통과 확인 → 커밋**

구현은 `POST https://openapi.naver.com/v1/datalab/search`, 헤더 `X-Naver-Client-Id/Secret`, 본문은 `startDate/endDate/timeUnit='date'/keywordGroups` 구성.

```bash
git add apps/web/src/lib/external/naverDatalab.ts apps/web/src/lib/external/naverDatalab.test.ts
git commit -m "feat(external): 네이버 데이터랩 검색어 트렌드 어댑터 추가"
```

### Task 2.3: 네이버 검색(블로그) 어댑터

**Files:**
- Create: `apps/web/src/lib/external/naverSearch.ts` + `.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

```ts
// naverSearch.test.ts
import { describe, it, expect, vi } from 'vitest';
import { searchBlogs } from './naverSearch';

describe('searchBlogs', () => {
  it('블로그 포스트 배열을 반환한다', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({
        items: [
          { title: '<b>벚꽃</b>놀이', link: 'https://x', description: 'd', bloggername: 'A', postdate: '20260415' }
        ],
      }),
    })));
    const res = await searchBlogs({
      clientId: 'x', clientSecret: 'y',
      query: '여의도 벚꽃', sort: 'sim', display: 10,
    });
    expect(res[0].title).toBe('벚꽃놀이');
    expect(res[0].postedAt).toEqual(new Date('2026-04-15'));
  });
});
```

- [ ] **Step 2: 실패 → 구현 → 통과 → 커밋**

구현 포인트:
- `GET https://openapi.naver.com/v1/search/blog.json?query=...&display=...&sort=...`
- 헤더 `X-Naver-Client-Id/Secret`
- `title`의 `<b>...</b>` 태그 제거
- `postdate` (YYYYMMDD)를 `Date`로 파싱

```bash
git commit -m "feat(external): 네이버 블로그 검색 어댑터 추가"
```

### Task 2.4: YouTube Data API v3 어댑터

**Files:**
- Create: `apps/web/src/lib/external/youtube.ts` + `.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

```ts
// youtube.test.ts
import { describe, it, expect, vi } from 'vitest';
import { searchYouTube, getVideoStats } from './youtube';

describe('searchYouTube', () => {
  it('검색 결과를 비디오 카드 배열로 반환한다', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({
        items: [{
          id: { videoId: 'abc' },
          snippet: {
            title: '여의도 벚꽃',
            description: '만개',
            channelTitle: '트래블',
            thumbnails: { medium: { url: 'https://t' } },
            publishedAt: '2026-04-10T00:00:00Z',
            channelId: 'c1',
          },
        }],
      }),
    })));
    const r = await searchYouTube({
      apiKey: 'k', query: '여의도 벚꽃',
      publishedAfter: new Date('2026-01-01'), maxResults: 20,
    });
    expect(r[0].videoId).toBe('abc');
  });
});
```

- [ ] **Step 2: 실패 → 구현 → 통과 → 커밋**

구현 포인트:
- `GET https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&order=relevance&regionCode=KR&relevanceLanguage=ko&videoDuration=medium&q=...&publishedAfter=...&maxResults=...&key=...`
- 별도 `getVideoStats(videoIds[])` 함수로 `videos?part=statistics&id=comma` 호출해 조회수 획득
- `viewCount` 없으면 0 처리

```bash
git commit -m "feat(external): 유튜브 Data API 검색/통계 어댑터 추가"
```

---

## Chunk 3: 지금 지수 산출 로직

순수 함수 모듈. 외부 의존성 없이 입력 → 점수 계산만 수행. 모든 함수는 0~100 반환.

### Task 3.1: 가중치 상수 파일

**Files:**
- Create: `apps/web/src/lib/now-score/weights.ts`

- [ ] **Step 1: 상수 정의 + 커밋**

```ts
// weights.ts
export const NOW_SCORE_WEIGHTS = {
  bloom: 0.47,
  trend: 0.29,
  content: 0.18,
  yoy: 0.06,
} as const;

export const BADGE_THRESHOLDS = {
  bloomPeak: 80,
  trending: 70,
  yoyRising: 70,
} as const;
```

```bash
git add apps/web/src/lib/now-score/weights.ts
git commit -m "feat(now-score): 가중치·배지 임계값 상수 추가"
```

### Task 3.2: 개화 진행률 (`bloom_score`)

**Files:**
- Create: `apps/web/src/lib/now-score/bloom.ts` + `.test.ts`

- [ ] **Step 1: 실패 테스트 (경계값 5종)**

```ts
// bloom.test.ts
import { describe, it, expect } from 'vitest';
import { calcBloomScore } from './bloom';

const period = {
  startAt: new Date('2026-04-10'),
  endAt: new Date('2026-04-20'),
};

describe('calcBloomScore', () => {
  it('개화 시작 30일 전은 0', () => {
    expect(calcBloomScore({
      now: new Date('2026-03-01'), ...period, recentTempC: null, recent7dRainMm: 0,
    })).toBe(0);
  });
  it('개화 시작일은 30점', () => {
    expect(calcBloomScore({
      now: new Date('2026-04-10'), ...period, recentTempC: null, recent7dRainMm: 0,
    })).toBeCloseTo(30, 0);
  });
  it('기간 중간은 100점', () => {
    expect(calcBloomScore({
      now: new Date('2026-04-15'), ...period, recentTempC: null, recent7dRainMm: 0,
    })).toBeCloseTo(100, 0);
  });
  it('누적 강우 80mm 초과 시 10% 감산', () => {
    const base = calcBloomScore({
      now: new Date('2026-04-15'), ...period, recentTempC: null, recent7dRainMm: 0,
    });
    const rained = calcBloomScore({
      now: new Date('2026-04-15'), ...period, recentTempC: null, recent7dRainMm: 90,
    });
    expect(rained).toBeCloseTo(base * 0.9, 1);
  });
  it('종료 14일 이후는 0', () => {
    expect(calcBloomScore({
      now: new Date('2026-05-10'), ...period, recentTempC: null, recent7dRainMm: 0,
    })).toBe(0);
  });
});
```

- [ ] **Step 2: 실패 → 구현**

```ts
// bloom.ts
export interface BloomInput {
  now: Date;
  startAt: Date;
  endAt: Date;
  recentTempC: number | null;
  recent7dRainMm: number;
}

export function calcBloomScore(input: BloomInput): number {
  const { now, startAt, endAt, recent7dRainMm } = input;
  const ms = (d: Date) => d.getTime();
  const DAY = 86400000;
  const start = ms(startAt), end = ms(endAt), t = ms(now);
  const mid = (start + end) / 2;

  let base = 0;
  if (t < start - 30 * DAY) base = 0;
  else if (t < start) base = 30 * (1 - (start - t) / (30 * DAY));
  else if (t < mid) base = 30 + 70 * ((t - start) / (mid - start));
  else if (t < end) base = 100 - 70 * ((t - mid) / (end - mid));
  else if (t < end + 14 * DAY) base = 30 * (1 - (t - end) / (14 * DAY));
  else base = 0;

  if (recent7dRainMm > 80) base *= 0.9;
  return Math.max(0, Math.min(100, Math.round(base * 100) / 100));
}
```

- [ ] **Step 3: 테스트 통과 확인 → 커밋**

```bash
pnpm --dir apps/web test -- src/lib/now-score/bloom.test.ts
git commit -m "feat(now-score): 개화 진행률 계산 함수 추가"
```

### Task 3.3: 검색 트렌드 점수 (`trend_score`)

**Files:**
- Create: `apps/web/src/lib/now-score/trend.ts` + `.test.ts`

- [ ] **Step 1: 실패 테스트 → 구현 → 통과 → 커밋**

```ts
// trend.ts
export function calcTrendScore(recent7dAvgRatio: number): number {
  return Math.max(0, Math.min(100, Math.round(recent7dAvgRatio * 100) / 100));
}
```

테스트: 0 → 0, 50 → 50, 110 → 100(클램프).

```bash
git commit -m "feat(now-score): 검색 트렌드 점수 계산 함수 추가"
```

### Task 3.4: 콘텐츠 발행량 점수 (`content_score`)

**Files:**
- Create: `apps/web/src/lib/now-score/content.ts` + `.test.ts`

- [ ] **Step 1: 실패 테스트 → 구현 → 통과 → 커밋**

```ts
// content.ts
export function calcContentScore(recentBlogCount: number, recentVideoCount: number): number {
  const b = Math.min(1, recentBlogCount / 30) * 100 * 0.6;
  const v = Math.min(1, recentVideoCount / 10) * 100 * 0.4;
  return Math.round((b + v) * 100) / 100;
}
```

테스트:
- 0/0 → 0
- 30/10 → 100
- 15/5 → 50
- 100/50 → 100 (클램프)

```bash
git commit -m "feat(now-score): 콘텐츠 발행량 점수 계산 함수 추가"
```

### Task 3.5: 연례 대비 증가율 점수 (`yoy_score`)

**Files:**
- Create: `apps/web/src/lib/now-score/yoy.ts` + `.test.ts`

- [ ] **Step 1: 실패 테스트 → 구현 → 통과 → 커밋**

```ts
// yoy.ts
export function calcYoyScore(recentAvg: number, lastYearAvg: number): number {
  if (lastYearAvg <= 0) return 50;  // 작년 데이터 없음 → 중립
  const ratio = recentAvg / lastYearAvg;
  const delta = Math.max(-50, Math.min(50, (ratio - 1) * 50));
  return Math.round((delta + 50) * 100) / 100;
}
```

테스트: 작년=0 → 50, ratio=1 → 50, ratio=2 → 100, ratio=0.5 → 25.

```bash
git commit -m "feat(now-score): 연례 대비 증가율 점수 계산 함수 추가"
```

### Task 3.6: 종합 점수 계산 (`now_score`)

**Files:**
- Create: `apps/web/src/lib/now-score/aggregate.ts` + `.test.ts`

- [ ] **Step 1: 실패 테스트 → 구현 → 통과 → 커밋**

```ts
// aggregate.ts
import { NOW_SCORE_WEIGHTS as W } from './weights';

export function calcNowScore(args: {
  bloom: number | null;
  trend: number | null;
  content: number | null;
  yoy: number | null;
}): number | null {
  if (args.bloom === null && args.trend === null && args.content === null) return null;
  const val = (n: number | null) => n ?? 0;
  const s = W.bloom * val(args.bloom)
          + W.trend * val(args.trend)
          + W.content * val(args.content)
          + W.yoy * val(args.yoy);
  return Math.round(s * 100) / 100;
}
```

테스트:
- 모두 null → null
- 각각 100점 → 100점 (가중합 검증)
- 일부 null → 0으로 대체한 값 반환

```bash
git commit -m "feat(now-score): 종합 점수 가중합 계산 함수 추가"
```

### Task 3.7: 배지 판정 함수

**Files:**
- Create: `apps/web/src/lib/now-score/badge.ts` + `.test.ts`

- [ ] **Step 1: 실패 테스트 → 구현 → 통과 → 커밋**

```ts
// badge.ts
import { BADGE_THRESHOLDS as T } from './weights';

export type NowBadge = 'bloom-peak' | 'trending' | 'yoy-rising';

export function pickBadges(scores: {
  bloom: number | null; trend: number | null; yoy: number | null;
}): NowBadge[] {
  const out: NowBadge[] = [];
  if ((scores.bloom ?? 0) >= T.bloomPeak) out.push('bloom-peak');
  if ((scores.trend ?? 0) >= T.trending) out.push('trending');
  if ((scores.yoy ?? 0) >= T.yoyRising) out.push('yoy-rising');
  return out;
}
```

테스트: 각 임계값 경계(79/80, 69/70) + 다중 배지 조합.

```bash
git commit -m "feat(now-score): 배지 판정 함수 추가"
```

---

## Chunk 4: 콘텐츠 필터 로직

### Task 4.1: 유튜브 결과 필터

**Files:**
- Create: `apps/web/src/lib/content-hub/filters.ts` + `.test.ts`

- [ ] **Step 1: 실패 테스트 작성 (규칙별 1 case씩)**

```ts
// filters.test.ts
import { describe, it, expect } from 'vitest';
import { filterVideos, filterBlogs } from './filters';

describe('filterVideos', () => {
  const spot = { name: '여의도', flower: '벚꽃', aliases: ['체리블로섬'], excludeKeywords: ['공원'] };
  const base = (o: Partial<any>) => ({
    videoId: 'v', title: '여의도 벚꽃', description: '', channelTitle: 'A', channelId: 'c1',
    publishedAt: new Date('2026-04-10'), viewCount: 5000, thumbnailUrl: 't', ...o,
  });

  it('제목에 명소명 없는 결과는 제거', () => {
    const r = filterVideos([base({ title: '봄꽃' })], spot);
    expect(r).toHaveLength(0);
  });
  it('조회수 1000 미만 제거', () => {
    const r = filterVideos([base({ viewCount: 500 })], spot);
    expect(r).toHaveLength(0);
  });
  it('동일 채널은 최신 1개만', () => {
    const v1 = base({ videoId: 'a', publishedAt: new Date('2026-04-01') });
    const v2 = base({ videoId: 'b', publishedAt: new Date('2026-04-10') });
    const r = filterVideos([v1, v2], spot);
    expect(r).toHaveLength(1);
    expect(r[0].videoId).toBe('b');
  });
  it('꽃이름 포함 시 relevance +0.2', () => {
    const [v] = filterVideos([base({ title: '여의도 벚꽃 만개' })], spot);
    expect(v.relevanceScore).toBeGreaterThanOrEqual(0.7);
  });
  it('제외 키워드 포함 시 제거', () => {
    const r = filterVideos([base({ title: '여의도 공원 벚꽃' })], spot);
    expect(r).toHaveLength(0);
  });
  it('최대 3개로 제한', () => {
    const items = [1,2,3,4,5].map(i => base({
      videoId: 'v'+i, channelId: 'c'+i,
      publishedAt: new Date(`2026-04-1${i}`),
    }));
    expect(filterVideos(items, spot)).toHaveLength(3);
  });
});
```

- [ ] **Step 2: 구현**

```ts
// filters.ts
export interface VideoItem {
  videoId: string;
  title: string;
  description: string;
  channelTitle: string;
  channelId: string;
  publishedAt: Date;
  viewCount: number;
  thumbnailUrl: string;
  relevanceScore?: number;
}
export interface SpotContext {
  name: string;
  flower: string;
  aliases: string[];
  excludeKeywords: string[];
}

export function filterVideos(items: VideoItem[], spot: SpotContext): VideoItem[] {
  const flowerTerms = [spot.flower, ...spot.aliases];
  const hasName = (s: string) => s.includes(spot.name);
  const hasExclude = (s: string) => spot.excludeKeywords.some(k => k && s.includes(k));

  const scored = items
    .filter(v => hasName(v.title) || hasName(v.description))
    .filter(v => v.viewCount >= 1000)
    .filter(v => !hasExclude(v.title + ' ' + v.description))
    .map(v => {
      const text = v.title + ' ' + v.description;
      const flowerHit = flowerTerms.some(t => t && text.includes(t));
      return { ...v, relevanceScore: flowerHit ? 0.7 : 0.5 };
    });

  const byChannel = new Map<string, VideoItem>();
  for (const v of scored.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())) {
    if (!byChannel.has(v.channelId)) byChannel.set(v.channelId, v);
  }
  return [...byChannel.values()]
    .sort((a, b) => (b.relevanceScore! - a.relevanceScore!) ||
                    (b.publishedAt.getTime() - a.publishedAt.getTime()))
    .slice(0, 3);
}
```

- [ ] **Step 3: 테스트 통과 확인**

```bash
pnpm --dir apps/web test -- src/lib/content-hub/filters.test.ts
```

- [ ] **Step 4: 커밋**

```bash
git commit -m "feat(content-hub): 유튜브 결과 필터 추가"
```

### Task 4.2: 블로그 결과 필터

같은 파일 `filters.ts`에 `filterBlogs(items, spot): BlogItem[]` 추가. 규칙:
- 제목에 `spot.name` **반드시 포함** (태그 제거 후)
- 12개월 이내 포스트만
- 동일 `bloggerName` 최신 1개
- 꽃이름/유의어 포함 시 가산점
- 최대 5개

테스트는 `filterVideos`와 유사한 6 case 작성 후 통과 확인.

```bash
git commit -m "feat(content-hub): 블로그 결과 필터 추가"
```

---

## Chunk 5: 크론 엔드포인트 + 스케줄

### Task 5.1: `CRON_SECRET` 인증 헬퍼

**Files:**
- Create: `apps/web/src/lib/cron/auth.ts` + `.test.ts`

- [ ] **Step 1: 실패 테스트 → 구현 → 통과 → 커밋**

```ts
// auth.ts
export function verifyCronAuth(req: Request): boolean {
  const header = req.headers.get('authorization');
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  return header === `Bearer ${expected}`;
}
```

테스트: 헤더 일치/불일치/없음, 환경변수 미설정 등.

```bash
git commit -m "feat(cron): CRON_SECRET Bearer 검증 헬퍼 추가"
```

### Task 5.2: 해시 샤딩 유틸

**Files:**
- Create: `apps/web/src/lib/cron/shard.ts` + `.test.ts`

- [ ] **Step 1: 실패 테스트 → 구현 → 통과 → 커밋**

```ts
// shard.ts
export function shardIndex(spotId: string, totalShards = 7): number {
  let hash = 0;
  for (let i = 0; i < spotId.length; i++) {
    hash = (hash * 31 + spotId.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % totalShards;
}
export function todayShard(now = new Date(), totalShards = 7): number {
  return (now.getUTCDay()) % totalShards;
}
```

테스트: 동일 id → 동일 샤드, 전체 분포가 편향되지 않음(100개 id로 7개 샤드에 대략 균등).

```bash
git commit -m "feat(cron): 명소 ID 해시 샤딩 유틸 추가"
```

### Task 5.3: `/api/cron/now-score` 엔드포인트

**Files:**
- Create: `apps/web/app/api/cron/now-score/route.ts`
- Create: `apps/web/app/api/cron/now-score/route.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

경로에 맞는 Next.js Route Handler 테스트. Mock:
- `verifyCronAuth` → true
- Supabase select → 명소 2개 반환
- 외부 API 어댑터 4개 → 고정값
- Supabase update → 호출 횟수 검증

```ts
// route.test.ts (발췌)
it('명소 2개에 대해 now_score 업데이트를 호출한다', async () => {
  // ... mocks
  const res = await POST(new Request('http://t', { headers: { authorization: 'Bearer s' }}));
  expect(res.status).toBe(200);
  expect(supabaseUpdateMock).toHaveBeenCalledTimes(2);
});
```

- [ ] **Step 2: 실패 → 구현**

```ts
// route.ts
import { NextResponse } from 'next/server';
import { verifyCronAuth } from '@/lib/cron/auth';
import { createServiceClient } from '@/lib/supabase/service';
import { fetchShortForecast } from '@/lib/external/kma';
import { fetchSearchTrends } from '@/lib/external/naverDatalab';
import { searchBlogs } from '@/lib/external/naverSearch';
import { searchYouTube } from '@/lib/external/youtube';
import { calcBloomScore } from '@/lib/now-score/bloom';
import { calcTrendScore } from '@/lib/now-score/trend';
import { calcContentScore } from '@/lib/now-score/content';
import { calcYoyScore } from '@/lib/now-score/yoy';
import { calcNowScore } from '@/lib/now-score/aggregate';

export const maxDuration = 300;

export async function POST(req: Request) {
  if (!verifyCronAuth(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const supabase = createServiceClient();
  const { data: spots } = await supabase.from('spots')
    .select('id, place, flower, latitude, longitude, bloom_start_at, bloom_end_at')
    .eq('status', 'published');

  for (const spot of spots ?? []) {
    try {
      const forecast = await fetchShortForecast({ /* lat/lng → nx/ny 변환 */ });
      // 데이터랩 5개씩 배치
      // 네이버 블로그 발행량
      // 유튜브 발행량 + 저장
      const bloom = calcBloomScore({ ... });
      const trend = calcTrendScore(...);
      const content = calcContentScore(...);
      const yoy = calcYoyScore(...);
      const now = calcNowScore({ bloom, trend, content, yoy });

      await supabase.from('spots').update({
        bloom_score: bloom, trend_score: trend, content_score: content,
        yoy_score: yoy, now_score: now, now_score_at: new Date().toISOString(),
      }).eq('id', spot.id);
    } catch (e) {
      console.error('now-score spot failed', spot.id, e);
    }
  }
  return NextResponse.json({ ok: true, processed: spots?.length ?? 0 });
}
```

- [ ] **Step 3: 통과 확인 → 커밋**

```bash
git commit -m "feat(api): /api/cron/now-score 엔드포인트 추가"
```

### Task 5.4: `/api/cron/content-sync` 엔드포인트

**Files:**
- Create: `apps/web/app/api/cron/content-sync/route.ts` + `.test.ts`

- [ ] **Step 1: 실패 테스트 → 구현 → 통과 → 커밋**

구현 포인트:
- 요일별 샤드(`todayShard`) 일치 명소만 처리
- 유튜브 `search.list` + `filterVideos` → `spot_videos` upsert (spot_id 기준 전체 교체)
- 네이버 블로그 2회 호출 + `filterBlogs` → `spot_blogs` upsert
- 실행 시간 로그 기록

```bash
git commit -m "feat(api): /api/cron/content-sync 샤드 기반 엔드포인트 추가"
```

### Task 5.5: `vercel.json` 크론 스케줄

**Files:**
- Create or Modify: `apps/web/vercel.json`

- [ ] **Step 1: 스케줄 등록**

```json
{
  "crons": [
    { "path": "/api/cron/now-score", "schedule": "0 21 * * *" },
    { "path": "/api/cron/content-sync", "schedule": "0 18 * * *" }
  ]
}
```

> Vercel Cron은 UTC 기준이므로 KST 06:00 = UTC 21:00 (전날), KST 03:00 = UTC 18:00 (전날).

- [ ] **Step 2: 환경변수 문서화**

`apps/web/.env.example`에 다음 항목 추가:
```
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
YOUTUBE_API_KEY=
KMA_SERVICE_KEY=
CRON_SECRET=
```

- [ ] **Step 3: 커밋**

```bash
git add apps/web/vercel.json apps/web/.env.example
git commit -m "feat(cron): Vercel Cron 스케줄 및 환경변수 문서화"
```

### Task 5.6: 프로덕션 환경변수 등록

- [ ] **Step 1: Vercel 대시보드 확인 (사용자 작업)**

사용자가 Vercel 대시보드에서 다음 환경변수를 Production에 등록했는지 확인:
- `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`
- `YOUTUBE_API_KEY`
- `KMA_SERVICE_KEY`
- `CRON_SECRET` (임의 생성: `openssl rand -hex 32`)
- `SUPABASE_SERVICE_ROLE_KEY`

> 이 단계는 코드 변경 없음. 실행 에이전트는 사용자에게 확인 요청 후 체크 표시.

---

## Chunk 6: 모바일 UI 통합 (apps/mobile)

모바일 앱은 Supabase에서 확장된 필드를 읽기만 한다. 외부 API 호출이나 비밀키 처리 없음.

### Task 6.1: 타입 및 매퍼 확장

**Files:**
- Modify: `apps/mobile/src/shared/data/types.ts`
- Modify: `apps/mobile/src/shared/data/spotMappers.ts` + `.test.ts`

- [ ] **Step 1: 타입 추가 테스트부터 → 매퍼 확장 → 통과 → 커밋**

`Spot` 타입에 선택 필드 추가: `nowScore?: number`, `bloomScore?`, `trendScore?`, `yoyScore?`, `nowScoreAt?: Date`.

신규 타입:
```ts
export interface SpotVideo { videoId: string; title: string; channelTitle: string; thumbnailUrl: string; publishedAt: Date; }
export interface SpotBlog  { url: string; title: string; bloggerName: string; postedAt: Date; }
```

`spotMappers.test.ts`에 "score 필드 유무 둘 다 매핑된다" 테스트 추가 후 매퍼 수정.

```bash
git commit -m "feat(mobile): 명소 타입/매퍼에 now_score 필드 반영"
```

### Task 6.2: `spotRepository` 메서드 추가

**Files:**
- Modify: `apps/mobile/src/shared/data/spotRepository.ts` + `.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

```ts
it('getTopSpots은 now_score 내림차순으로 10개 반환', async () => {
  // mock supabase select
  const r = await getTopSpots(10);
  expect(r).toHaveLength(10);
  expect(r[0].nowScore).toBeGreaterThanOrEqual(r[1].nowScore!);
});
it('getSpotContent은 비디오 3개/블로그 5개를 반환', async () => {
  const r = await getSpotContent('slug');
  expect(r.videos).toHaveLength(3);
  expect(r.blogs).toHaveLength(5);
});
```

- [ ] **Step 2: 구현 → 통과 → 커밋**

`.from('spots').select('*').order('now_score', { ascending: false }).limit(n)` 형태.
`getSpotContent`은 `spot_videos`와 `spot_blogs`를 각각 조회.

```bash
git commit -m "feat(mobile): getTopSpots/getSpotContent 레포지토리 메서드 추가"
```

### Task 6.3: 배지 컴포넌트

**Files:**
- Create: `apps/mobile/src/shared/ui/NowScoreBadges.tsx` + `.test.tsx`

- [ ] **Step 1: 실패 테스트 → 구현 → 통과 → 커밋**

배지 종류 3개(`bloom-peak`, `trending`, `yoy-rising`). Spec 9.1의 이모지+라벨을 `<Chip>` 형태로 렌더. 점수 입력에 따라 배지 목록 표시.

```bash
git commit -m "feat(mobile): NowScoreBadges 컴포넌트 추가"
```

### Task 6.4: 홈 "오늘의 TOP 10" 섹션

**Files:**
- Modify: `apps/mobile/src/features/home/HomeScreen.tsx` (또는 하위 섹션 파일)

- [ ] **Step 1: 기존 피처드 카루셀 바로 아래에 섹션 추가**

- React Query `useQuery(['top-spots', 10], () => getTopSpots(10))` 구독
- 카드에 `NowScoreBadges` 표시
- 로딩/에러/0개 상태 처리

- [ ] **Step 2: 섹션 테스트 (React Native Testing Library) → 통과 → 커밋**

```bash
git commit -m "feat(mobile): 홈에 오늘의 TOP 10 섹션 추가"
```

### Task 6.5: 지도 마커 차등 스타일

**Files:**
- Modify: `apps/mobile/src/features/map/MapScreen.tsx` (마커 컴포넌트)

- [ ] **Step 1: `now_score` 구간(0-50/50-80/80-100) 별 마커 크기/색상 3단계 설정 → 스냅샷 테스트 업데이트 → 커밋**

```bash
git commit -m "feat(mobile): 지도 마커를 now_score 구간별로 차등 표시"
```

### Task 6.6: 검색 화면 "추천순" 정렬

**Files:**
- Modify: `apps/mobile/src/features/search/SearchScreen.tsx`

- [ ] **Step 1: 정렬 옵션에 "추천순" 추가, 기본값으로 설정 → 기존 테스트 업데이트 → 커밋**

```bash
git commit -m "feat(mobile): 검색 화면 기본 정렬을 추천순(now_score)으로 전환"
```

### Task 6.7: 명소 상세 "이 명소 이야기" 섹션

**Files:**
- Create: `apps/mobile/src/features/spot/SpotStoriesSection.tsx` + `.test.tsx`
- Modify: `apps/mobile/src/features/spot/SpotDetailScreen.tsx`

- [ ] **Step 1: 실패 테스트 작성**

```tsx
it('비디오 3개와 블로그 5개를 렌더', async () => {
  // mock getSpotContent
  const { findAllByTestId } = render(<SpotStoriesSection slug="x" />);
  expect(await findAllByTestId('story-video')).toHaveLength(3);
  expect(await findAllByTestId('story-blog')).toHaveLength(5);
});
it('둘 다 0개면 섹션 자체를 렌더하지 않는다', () => {
  // mock empty
  const { queryByTestId } = render(<SpotStoriesSection slug="x" />);
  expect(queryByTestId('spot-stories-section')).toBeNull();
});
```

- [ ] **Step 2: 구현 → 통과 → 커밋**

비디오 탭 시 `Linking.openURL('https://youtu.be/'+videoId)`, 블로그는 `Linking.openURL(url)`.

```bash
git commit -m "feat(mobile): 명소 상세에 이 명소 이야기 섹션 추가"
```

---

## Chunk 7: 웹 UI 통합 (apps/web 공개 페이지)

모바일과 동일한 정보를 웹에서 보여주되, 웹의 기존 데이터 훅 구조에 맞춰 적용.

### Task 7.1: 웹 데이터 페칭 확장

**Files:**
- Modify: `apps/web/src/features/public/spots/*` (기존 조회 훅)

- [ ] **Step 1: Supabase 쿼리에 `now_score` 계열 컬럼 추가 → 기존 테스트 업데이트 → 커밋**

```bash
git commit -m "feat(web): 공개 페이지 쿼리에 now_score 필드 포함"
```

### Task 7.2: 배지 컴포넌트 (웹)

**Files:**
- Create: `apps/web/src/components/NowScoreBadges.tsx` + `.test.tsx`

- [ ] **Step 1: 모바일과 동일한 API 형태로 웹 버전 구현 (Tailwind 스타일) → 테스트 → 커밋**

```bash
git commit -m "feat(web): NowScoreBadges 컴포넌트 추가"
```

### Task 7.3: 홈 페이지 TOP 10

**Files:**
- Modify: `apps/web/app/(public)/page.tsx`

- [ ] **Step 1: 서버 컴포넌트에서 `getTopSpots(10)` 호출 → 섹션 렌더 → 커밋**

```bash
git commit -m "feat(web): 홈 페이지에 오늘의 TOP 10 섹션 추가"
```

### Task 7.4: 지도 마커 차등

**Files:**
- Modify: `apps/web/app/(public)/map/page.tsx` + 하위 마커 컴포넌트

- [ ] **Step 1: 네이버 지도 웹 SDK 마커에 score 구간별 색상 적용 → 커밋**

```bash
git commit -m "feat(web): 지도 마커를 now_score 구간별로 차등 표시"
```

### Task 7.5: 검색 정렬 옵션

**Files:**
- Modify: `apps/web/app/(public)/search/page.tsx`

- [ ] **Step 1: 기본 정렬을 `now_score DESC`로 전환 → 테스트 → 커밋**

```bash
git commit -m "feat(web): 검색 결과 기본 정렬을 추천순으로 전환"
```

### Task 7.6: 명소 상세 "이 명소 이야기"

**Files:**
- Create: `apps/web/src/features/public/spots/SpotStoriesSection.tsx` + `.test.tsx`
- Modify: `apps/web/app/(public)/spot/[slug]/page.tsx`

- [ ] **Step 1: 서버 컴포넌트에서 비디오/블로그 로드 → 섹션 렌더 → 0개면 숨김 → 커밋**

```bash
git commit -m "feat(web): 명소 상세에 이 명소 이야기 섹션 추가"
```

---

## Chunk 8: 관리자 UI

### Task 8.1: `flowers.aliases` 편집

**Files:**
- Modify: `apps/web/app/admin/flowers/page.tsx` + 관련 폼

- [ ] **Step 1: 유의어 텍스트 입력 필드(태그 형태) 추가 → 저장 핸들러 확장 → 테스트 → 커밋**

```bash
git commit -m "feat(admin): 꽃 유의어 편집 UI 추가"
```

### Task 8.2: `spots.exclude_keywords` 편집

**Files:**
- Modify: `apps/web/app/admin/spots/[id]/page.tsx` + 관련 폼

- [ ] **Step 1: 제외 키워드 태그 입력 필드 추가 → 저장 핸들러 확장 → 테스트 → 커밋**

```bash
git commit -m "feat(admin): 명소 제외 키워드 편집 UI 추가"
```

---

## Chunk 9: 릴리스 검증

### Task 9.1: 스테이징 배치 실행

- [ ] **Step 1: Vercel 미리보기 환경에서 수동 트리거**

```bash
curl -X POST https://flower-map-git-<branch>.vercel.app/api/cron/now-score \
     -H "Authorization: Bearer $CRON_SECRET"
```
Expected: `{ "ok": true, "processed": N }`

- [ ] **Step 2: Supabase 콘솔에서 `spots.now_score` 값 확인 (5개 이상 명소에 값이 들어갔는지)**

- [ ] **Step 3: `/api/cron/content-sync`도 동일 절차 수행 후 `spot_videos`, `spot_blogs` 개수 확인**

### Task 9.2: 모바일 앱 EAS Update 검토

- [ ] **Step 1: `apps/mobile/app.config.ts`의 `version`과 `runtimeVersion` 확인**
  - 네이티브 변경 없음 → **OTA(EAS Update)로 배포 가능** (`runtimeVersion: { policy: 'appVersion' }` 유지)
  - `version`은 그대로 둠

- [ ] **Step 2: EAS Update 실행**

```bash
pnpm --dir apps/mobile eas update --branch production --message "feat: now-score/content-hub"
```

### Task 9.3: 모니터링

- [ ] **Step 1: Sentry에서 `/api/cron/*` 에러 리포팅 발생 여부 24시간 관찰**
- [ ] **Step 2: Vercel 대시보드 Cron 로그 확인 (실행 성공/시간)**
- [ ] **Step 3: 외부 API 쿼터 사용률 확인 (YouTube Cloud Console, 네이버 개발자 센터, 공공데이터포털)**

---

## 운영 런북

- **점수가 이상할 때**: `apps/web/src/lib/now-score/weights.ts`와 `badge.ts` 수정 후 다음 배치 대기 또는 수동 트리거
- **특정 명소 콘텐츠가 엉뚱할 때**: 관리자 화면에서 `exclude_keywords`에 무관 키워드 추가
- **유튜브 쿼터 초과**: 샤드 수를 7 → 14로 늘려 2주 주기로 분산 (`shard.ts`에서 조정)
- **KMA 키 만료**: 공공데이터포털에서 재발급 → Vercel 환경변수 갱신 → 다음 배치부터 반영

## 후속 과제 (v2 이후)

- 지역별 평년 기온 세분화 (현재는 전국 평균 상수)
- Growing Degree Days 모델로 개화 시작일 정밀 예측
- 사용자 개인화(자주 본 꽃·저장 명소 가중)
- 관리자 점수 튜닝 A/B 대시보드
- 인스타그램·X 공식 API 연동 (정책 확인 후)
