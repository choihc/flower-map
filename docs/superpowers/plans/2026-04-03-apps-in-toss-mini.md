# 앱인토스용 꽃 어디 미니앱 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 `apps/mobile`에 영향 없이 별도 워크스페이스에서 앱인토스용 `꽃 어디` 미니앱을 구현하고, 네이버지도 렌더링과 마커 인터랙션을 포함한 MVP를 완성한다.

**Architecture:** 구현은 `.worktrees/toss-mini` 안에서만 진행한다. `apps/toss-mini`는 앱인토스 전용 화면과 Granite 설정을 담당하고, `packages/flower-domain`은 명소 조회와 매핑 로직을, `packages/storage-adapters`는 로컬 즐겨찾기 저장을 담당한다. 가장 먼저 네이버지도 모듈이 Granite 환경에서 실제로 렌더링되는지 스파이크로 검증한 뒤, 통과하면 홈/지도/상세/저장 화면을 그 위에 올린다.

**Tech Stack:** Apps in Toss SDK 2.x, Granite React Native, TypeScript, React Native, `@mj-studio/react-native-naver-map`, Supabase, Vitest

---

## 파일 구조

### 새로 만들 파일

- `.worktrees/toss-mini/apps/toss-mini/src/app/AppProviders.tsx`
- `.worktrees/toss-mini/apps/toss-mini/src/lib/env.ts`
- `.worktrees/toss-mini/apps/toss-mini/src/lib/navigation.ts`
- `.worktrees/toss-mini/apps/toss-mini/src/features/home/HomeScreen.tsx`
- `.worktrees/toss-mini/apps/toss-mini/src/features/map/MapScreen.tsx`
- `.worktrees/toss-mini/apps/toss-mini/src/features/map/components/NaverMapCanvas.tsx`
- `.worktrees/toss-mini/apps/toss-mini/src/features/map/components/SpotMarkerLayer.tsx`
- `.worktrees/toss-mini/apps/toss-mini/src/features/map/components/SelectedSpotCard.tsx`
- `.worktrees/toss-mini/apps/toss-mini/src/features/spot/SpotDetailScreen.tsx`
- `.worktrees/toss-mini/apps/toss-mini/src/features/favorites/FavoritesScreen.tsx`
- `.worktrees/toss-mini/apps/toss-mini/src/features/common/useNearbySpots.ts`
- `.worktrees/toss-mini/apps/toss-mini/src/features/common/useFavoriteSpotIds.ts`
- `.worktrees/toss-mini/apps/toss-mini/src/ui/Screen.tsx`
- `.worktrees/toss-mini/apps/toss-mini/src/ui/Section.tsx`
- `.worktrees/toss-mini/apps/toss-mini/src/ui/SpotListItem.tsx`
- `.worktrees/toss-mini/apps/toss-mini/src/ui/PrimaryButton.tsx`
- `.worktrees/toss-mini/apps/toss-mini/src/ui/theme.ts`
- `.worktrees/toss-mini/packages/flower-domain/package.json`
- `.worktrees/toss-mini/packages/flower-domain/tsconfig.json`
- `.worktrees/toss-mini/packages/flower-domain/src/index.ts`
- `.worktrees/toss-mini/packages/flower-domain/src/types.ts`
- `.worktrees/toss-mini/packages/flower-domain/src/mappers/mapSpotRow.ts`
- `.worktrees/toss-mini/packages/flower-domain/src/queries/getFeaturedSpots.ts`
- `.worktrees/toss-mini/packages/flower-domain/src/queries/getSpotById.ts`
- `.worktrees/toss-mini/packages/flower-domain/src/queries/getSpotsAround.ts`
- `.worktrees/toss-mini/packages/flower-domain/src/queries/getFlowerFilters.ts`
- `.worktrees/toss-mini/packages/flower-domain/src/__tests__/mapSpotRow.test.ts`
- `.worktrees/toss-mini/packages/flower-domain/src/__tests__/getSpotsAround.test.ts`
- `.worktrees/toss-mini/packages/storage-adapters/package.json`
- `.worktrees/toss-mini/packages/storage-adapters/tsconfig.json`
- `.worktrees/toss-mini/packages/storage-adapters/src/index.ts`
- `.worktrees/toss-mini/packages/storage-adapters/src/favorites/FavoriteStore.ts`
- `.worktrees/toss-mini/packages/storage-adapters/src/favorites/appsInTossFavoriteStore.ts`
- `.worktrees/toss-mini/packages/storage-adapters/src/favorites/memoryFavoriteStore.ts`
- `.worktrees/toss-mini/packages/storage-adapters/src/favorites/__tests__/memoryFavoriteStore.test.ts`
- `.worktrees/toss-mini/apps/toss-mini/vitest.config.ts`
- `.worktrees/toss-mini/apps/toss-mini/src/test/setup.ts`
- `.worktrees/toss-mini/apps/toss-mini/src/features/map/components/__tests__/SelectedSpotCard.test.tsx`
- `.worktrees/toss-mini/apps/toss-mini/src/features/spot/__tests__/SpotDetailScreen.test.tsx`

### 수정할 파일

- `.worktrees/toss-mini/apps/toss-mini/package.json`
- `.worktrees/toss-mini/apps/toss-mini/granite.config.ts`
- `.worktrees/toss-mini/apps/toss-mini/_app.tsx`
- `.worktrees/toss-mini/apps/toss-mini/pages/index.tsx`
- `.worktrees/toss-mini/apps/toss-mini/pages/spot/[id].tsx`
- `.worktrees/toss-mini/apps/toss-mini/tsconfig.json`
- `.worktrees/toss-mini/pnpm-workspace.yaml`
- `.worktrees/toss-mini/packages/supabase/src/client.ts`
- `.worktrees/toss-mini/packages/supabase/src/index.ts`
- `.worktrees/toss-mini/packages/supabase/src/types.ts`

### 책임 분리

- `apps/toss-mini`: 화면, 앱인토스 연동, 지도 컴포넌트, 라우팅
- `packages/flower-domain`: 조회, 타입, 응답 매핑, 정렬/필터 계산
- `packages/storage-adapters`: 즐겨찾기 인터페이스와 저장 구현체
- `packages/supabase`: DB 클라이언트와 공용 row 타입

---

## Chunk 1: 워크스페이스와 테스트 기반 정리

### Task 1: 앱인토스 앱 의존성과 테스트 러너 준비

**Files:**
- Modify: `.worktrees/toss-mini/apps/toss-mini/package.json`
- Create: `.worktrees/toss-mini/apps/toss-mini/vitest.config.ts`
- Create: `.worktrees/toss-mini/apps/toss-mini/src/test/setup.ts`
- Modify: `.worktrees/toss-mini/apps/toss-mini/tsconfig.json`

- [ ] **Step 1: 패키지 의존성 변경 테스트부터 작성**

```ts
// src/test/setup.ts
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react-native';

afterEach(() => {
  cleanup();
});
```

- [ ] **Step 2: 테스트 러너 설정 추가**

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
});
```

- [ ] **Step 3: 앱 패키지에 필요한 의존성 추가**

```json
{
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@mj-studio/react-native-naver-map": "^2.7.0",
    "@tanstack/react-query": "^5.95.2",
    "@apps-in-toss/framework": "^2.0.0",
    "@granite-js/react-native": "^2.0.0",
    "@toss/tds-react-native": "^1.0.0",
    "@flower-map/supabase": "workspace:*",
    "@flower-map/flower-domain": "workspace:*",
    "@flower-map/storage-adapters": "workspace:*"
  },
  "devDependencies": {
    "@testing-library/react-native": "^13.3.3",
    "jsdom": "^29.0.1",
    "vitest": "^3.2.4",
    "@types/react": "^19.0.0",
    "typescript": "^5.0.0"
  }
}
```

- [ ] **Step 4: 타입체크와 빈 테스트 실행**

Run: `cd /Users/user/workspace/flower-map/.worktrees/toss-mini/apps/toss-mini && pnpm test && pnpm typecheck`  
Expected: test runner starts successfully, `tsc` passes or only shows known path issues to fix immediately

- [ ] **Step 5: 커밋**

```bash
cd /Users/user/workspace/flower-map/.worktrees/toss-mini
git add apps/toss-mini/package.json apps/toss-mini/vitest.config.ts apps/toss-mini/src/test/setup.ts apps/toss-mini/tsconfig.json
git commit -m "chore(toss-mini): add test and typecheck foundation"
```

### Task 2: 워크스페이스 패키지 연결

**Files:**
- Modify: `.worktrees/toss-mini/pnpm-workspace.yaml`
- Create: `.worktrees/toss-mini/packages/flower-domain/package.json`
- Create: `.worktrees/toss-mini/packages/flower-domain/tsconfig.json`
- Create: `.worktrees/toss-mini/packages/storage-adapters/package.json`
- Create: `.worktrees/toss-mini/packages/storage-adapters/tsconfig.json`

- [ ] **Step 1: workspace 인식 테스트**

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

- [ ] **Step 2: 신규 패키지 매니페스트 추가**

```json
{
  "name": "@flower-map/flower-domain",
  "version": "0.1.0",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "dependencies": {
    "@flower-map/supabase": "workspace:*"
  }
}
```

- [ ] **Step 3: storage 패키지 매니페스트 추가**

```json
{
  "name": "@flower-map/storage-adapters",
  "version": "0.1.0",
  "main": "src/index.ts",
  "types": "src/index.ts"
}
```

- [ ] **Step 4: 워크스페이스 설치 검증**

Run: `cd /Users/user/workspace/flower-map/.worktrees/toss-mini && pnpm install`  
Expected: `apps/toss-mini`가 새 workspace 패키지 의존성을 정상 인식

- [ ] **Step 5: 커밋**

```bash
git add pnpm-workspace.yaml packages/flower-domain/package.json packages/flower-domain/tsconfig.json packages/storage-adapters/package.json packages/storage-adapters/tsconfig.json
git commit -m "chore(toss-mini): register domain and storage packages"
```

---

## Chunk 2: 도메인 조회 계층 분리

### Task 3: Supabase row 타입과 공용 클라이언트 정리

**Files:**
- Modify: `.worktrees/toss-mini/packages/supabase/src/types.ts`
- Modify: `.worktrees/toss-mini/packages/supabase/src/client.ts`
- Modify: `.worktrees/toss-mini/packages/supabase/src/index.ts`

- [ ] **Step 1: row 타입 보강 테스트 작성**

```ts
// packages/flower-domain/src/__tests__/mapSpotRow.test.ts 에서 사용할 최소 row 타입 예시
const row = {
  id: 'spot-1',
  slug: 'yeouido',
  name: '여의도 한강공원',
  description: '벚꽃 명소',
  short_tip: '한강 산책',
  region_secondary: '서울 영등포구',
  admission_fee: null,
  parking_info: '공영주차장',
  festival_start_at: null,
  festival_end_at: null,
  bloom_start_at: '2026-03-28',
  bloom_end_at: '2026-04-10',
  is_featured: true,
  latitude: 37.52,
  longitude: 126.92,
  thumbnail_url: null,
  flower: {
    name_ko: '벚꽃',
    thumbnail_url: null,
  },
};
```

- [ ] **Step 2: `PublishedSpotRow`에 지도/상세 화면에서 필요한 필드 누락 여부 정리**

```ts
export type PublishedSpotRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  short_tip: string;
  region_secondary: string;
  admission_fee: string | null;
  parking_info: string | null;
  festival_start_at: string | null;
  festival_end_at: string | null;
  bloom_start_at: string;
  bloom_end_at: string;
  is_featured: boolean;
  latitude: number;
  longitude: number;
  thumbnail_url: string | null;
  flower: PublishedSpotFlower;
};
```

- [ ] **Step 3: 환경 변수 에러 메시지와 export 경로 정리**

```ts
export { supabase } from './client';
export type { PublishedSpotRow, PublishedSpotFlower, FlowerSpot } from './types';
```

- [ ] **Step 4: 타입체크 실행**

Run: `cd /Users/user/workspace/flower-map/.worktrees/toss-mini && pnpm --filter @flower-map/supabase exec tsc --noEmit`  
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add packages/supabase/src/client.ts packages/supabase/src/index.ts packages/supabase/src/types.ts
git commit -m "refactor(toss-mini): stabilize shared supabase package"
```

### Task 4: flower-domain 매퍼와 조회 함수 작성

**Files:**
- Create: `.worktrees/toss-mini/packages/flower-domain/src/types.ts`
- Create: `.worktrees/toss-mini/packages/flower-domain/src/mappers/mapSpotRow.ts`
- Create: `.worktrees/toss-mini/packages/flower-domain/src/queries/getFeaturedSpots.ts`
- Create: `.worktrees/toss-mini/packages/flower-domain/src/queries/getSpotById.ts`
- Create: `.worktrees/toss-mini/packages/flower-domain/src/queries/getSpotsAround.ts`
- Create: `.worktrees/toss-mini/packages/flower-domain/src/queries/getFlowerFilters.ts`
- Create: `.worktrees/toss-mini/packages/flower-domain/src/index.ts`
- Create: `.worktrees/toss-mini/packages/flower-domain/src/__tests__/mapSpotRow.test.ts`
- Create: `.worktrees/toss-mini/packages/flower-domain/src/__tests__/getSpotsAround.test.ts`

- [ ] **Step 1: `mapSpotRow` 실패 테스트 작성**

```ts
import { describe, expect, it } from 'vitest';
import { mapSpotRow } from '../mappers/mapSpotRow';

describe('mapSpotRow', () => {
  it('Supabase row를 화면용 spot 모델로 변환한다', () => {
    const spot = mapSpotRow(row);
    expect(spot.id).toBe('spot-1');
    expect(spot.place).toBe('여의도 한강공원');
    expect(spot.flower).toBe('벚꽃');
    expect(spot.location).toBe('서울 영등포구');
  });
});
```

- [ ] **Step 2: `mapSpotRow` 최소 구현**

```ts
export function mapSpotRow(row: PublishedSpotRow): FlowerSpot {
  return {
    id: row.id,
    slug: row.slug,
    place: row.name,
    flower: row.flower.name_ko,
    location: row.region_secondary,
    helper: row.short_tip,
    description: row.description,
    latitude: row.latitude,
    longitude: row.longitude,
    thumbnailUrl: row.thumbnail_url,
    flowerThumbnailUrl: row.flower.thumbnail_url,
    parking: row.parking_info ?? '주차 정보 없음',
    fee: row.admission_fee ?? '정보 없음',
    festivalDate: row.festival_start_at && row.festival_end_at
      ? `${row.festival_start_at} - ${row.festival_end_at}`
      : '행사 정보 없음',
    bloomStartAt: row.bloom_start_at,
    bloomEndAt: row.bloom_end_at,
    bloomStatus: '개화 정보 확인 필요',
    badge: row.is_featured ? '추천 명소' : '명소',
    tone: 'green',
  };
}
```

- [ ] **Step 3: 반경 조회 함수 실패 테스트 작성**

```ts
describe('getSpotsAround', () => {
  it('위경도 기준으로 가까운 순서로 spot을 반환한다', async () => {
    const spots = await getSpotsAround({
      latitude: 37.52,
      longitude: 126.92,
      limit: 10,
    });
    expect(Array.isArray(spots)).toBe(true);
  });
});
```

- [ ] **Step 4: 최소 조회 함수 구현**

```ts
export async function getFeaturedSpots() { /* select + mapSpotRow */ }
export async function getSpotById(id: string) { /* single row select */ }
export async function getSpotsAround(params: { latitude: number; longitude: number; limit: number }) { /* list select + distance sort */ }
export async function getFlowerFilters() { /* distinct flower names */ }
```

- [ ] **Step 5: 패키지 테스트 실행**

Run: `cd /Users/user/workspace/flower-map/.worktrees/toss-mini && pnpm --filter @flower-map/flower-domain exec vitest run`  
Expected: PASS

- [ ] **Step 6: 커밋**

```bash
git add packages/flower-domain
git commit -m "feat(toss-mini): add shared flower domain queries"
```

---

## Chunk 3: 네이버지도 P0 기술 검증

### Task 5: Granite 환경에서 네이버지도 렌더링 스파이크

**Files:**
- Modify: `.worktrees/toss-mini/apps/toss-mini/package.json`
- Modify: `.worktrees/toss-mini/apps/toss-mini/granite.config.ts`
- Create: `.worktrees/toss-mini/apps/toss-mini/src/features/map/components/NaverMapCanvas.tsx`
- Modify: `.worktrees/toss-mini/apps/toss-mini/pages/index.tsx`

- [ ] **Step 1: 스파이크용 최소 화면 테스트 시나리오 작성**

```tsx
// 구현 전 체크리스트
// 1. 지도 컨테이너가 렌더링되는가
// 2. 기본 좌표로 카메라가 이동되는가
// 3. 샘플 마커가 1개 보이는가
// 4. 마커 탭 콜백이 발생하는가
```

- [ ] **Step 2: Granite config에 지도/위치 관련 최소 설정 반영**

```ts
import { appsInToss } from '@apps-in-toss/framework/plugins';
import { defineConfig } from '@granite-js/react-native/config';

export default defineConfig({
  scheme: 'flower-map-toss-mini',
  appName: 'flower-map',
  plugins: [
    appsInToss({
      brand: {
        displayName: '꽃 어디',
        primaryColor: '#5C9E66',
        icon: '',
      },
      permissions: [
        {
          name: 'geolocation',
          access: 'access',
        },
      ],
    }),
  ],
});
```

- [ ] **Step 3: 지도 캔버스 최소 구현**

```tsx
export function NaverMapCanvas() {
  return (
    <NaverMapView
      style={{ flex: 1 }}
      camera={{ latitude: 37.5665, longitude: 126.978, zoom: 11 }}
    >
      <NaverMapMarker
        latitude={37.5665}
        longitude={126.978}
        onTap={() => console.log('marker-tapped')}
      />
    </NaverMapView>
  );
}
```

- [ ] **Step 4: 로컬 실행으로 실제 렌더링 검증**

Run: `cd /Users/user/workspace/flower-map/.worktrees/toss-mini/apps/toss-mini && pnpm dev`  
Expected: 토스 샌드박스 또는 로컬 RN 개발 환경에서 지도 화면 렌더링 확인

- [ ] **Step 5: 검증 결과 기록**

```md
- 성공 시: 구현 계획 유지
- 실패 시: 문제 원인, 에러 로그, 대체 라이브러리/대체 UX 후보 기록
```

- [ ] **Step 6: 커밋**

```bash
git add apps/toss-mini/package.json apps/toss-mini/granite.config.ts apps/toss-mini/src/features/map/components/NaverMapCanvas.tsx apps/toss-mini/pages/index.tsx
git commit -m "feat(toss-mini): validate naver map spike in granite app"
```

### Task 6: 마커 선택 카드 UI 테스트와 구현

**Files:**
- Create: `.worktrees/toss-mini/apps/toss-mini/src/features/map/components/SelectedSpotCard.tsx`
- Create: `.worktrees/toss-mini/apps/toss-mini/src/features/map/components/__tests__/SelectedSpotCard.test.tsx`

- [ ] **Step 1: 실패 테스트 작성**

```tsx
import { render } from '@testing-library/react-native';
import { SelectedSpotCard } from '../SelectedSpotCard';

it('선택된 명소의 이름과 버튼을 렌더링한다', () => {
  const { getByText } = render(
    <SelectedSpotCard
      spot={{ id: 'spot-1', place: '여의도 한강공원', helper: '한강 산책', flower: '벚꽃' }}
      onPressDetail={() => {}}
    />
  );

  expect(getByText('여의도 한강공원')).toBeTruthy();
  expect(getByText('상세 보기')).toBeTruthy();
});
```

- [ ] **Step 2: 최소 구현**

```tsx
export function SelectedSpotCard({ spot, onPressDetail }: Props) {
  return (
    <View>
      <Text>{spot.place}</Text>
      <Text>{spot.helper}</Text>
      <Pressable onPress={onPressDetail}>
        <Text>상세 보기</Text>
      </Pressable>
    </View>
  );
}
```

- [ ] **Step 3: 테스트 실행**

Run: `cd /Users/user/workspace/flower-map/.worktrees/toss-mini/apps/toss-mini && pnpm test -- SelectedSpotCard`  
Expected: PASS

- [ ] **Step 4: 커밋**

```bash
git add apps/toss-mini/src/features/map/components/SelectedSpotCard.tsx apps/toss-mini/src/features/map/components/__tests__/SelectedSpotCard.test.tsx
git commit -m "feat(toss-mini): add selected spot card for map interactions"
```

---

## Chunk 4: MVP 화면과 로컬 즐겨찾기

### Task 7: FavoriteStore 인터페이스와 메모리 테스트 더블 구현

**Files:**
- Create: `.worktrees/toss-mini/packages/storage-adapters/src/favorites/FavoriteStore.ts`
- Create: `.worktrees/toss-mini/packages/storage-adapters/src/favorites/memoryFavoriteStore.ts`
- Create: `.worktrees/toss-mini/packages/storage-adapters/src/favorites/__tests__/memoryFavoriteStore.test.ts`
- Create: `.worktrees/toss-mini/packages/storage-adapters/src/index.ts`

- [ ] **Step 1: 실패 테스트 작성**

```ts
import { describe, expect, it } from 'vitest';
import { createMemoryFavoriteStore } from '../memoryFavoriteStore';

describe('memory favorite store', () => {
  it('toggle 호출 시 id를 추가/제거한다', async () => {
    const store = createMemoryFavoriteStore();
    await store.toggle('spot-1');
    expect(await store.has('spot-1')).toBe(true);
    await store.toggle('spot-1');
    expect(await store.has('spot-1')).toBe(false);
  });
});
```

- [ ] **Step 2: 인터페이스와 구현 작성**

```ts
export interface FavoriteStore {
  getAll(): Promise<string[]>;
  has(spotId: string): Promise<boolean>;
  toggle(spotId: string): Promise<boolean>;
}
```

- [ ] **Step 3: 테스트 실행**

Run: `cd /Users/user/workspace/flower-map/.worktrees/toss-mini && pnpm --filter @flower-map/storage-adapters exec vitest run`  
Expected: PASS

- [ ] **Step 4: 커밋**

```bash
git add packages/storage-adapters
git commit -m "feat(toss-mini): add favorite store contracts"
```

### Task 8: Apps in Toss Storage 기반 즐겨찾기 구현

**Files:**
- Create: `.worktrees/toss-mini/packages/storage-adapters/src/favorites/appsInTossFavoriteStore.ts`
- Create: `.worktrees/toss-mini/apps/toss-mini/src/features/common/useFavoriteSpotIds.ts`

- [ ] **Step 1: 구현 전 저장 포맷 결정**

```ts
const FAVORITE_KEY = 'flower-map.favorite-spot-ids';
type SerializedFavoriteIds = string[];
```

- [ ] **Step 2: Storage 기반 구현**

```ts
import { Storage } from '@apps-in-toss/framework';

export function createAppsInTossFavoriteStore(): FavoriteStore {
  // getItem -> JSON.parse
  // setItem -> JSON.stringify
  // toggle -> 추가/제거 후 최신 상태 반환
}
```

- [ ] **Step 3: 화면 훅 연결**

```ts
export function useFavoriteSpotIds() {
  // screen focus 시 재조회
  // toggle 시 로컬 상태 갱신
}
```

- [ ] **Step 4: 수동 검증**

Run: `저장 버튼 탭 -> 앱 재진입 -> 저장 상태 유지 확인`  
Expected: same device within apps-in-toss sandbox keeps favorite ids

- [ ] **Step 5: 커밋**

```bash
git add packages/storage-adapters/src/favorites/appsInTossFavoriteStore.ts apps/toss-mini/src/features/common/useFavoriteSpotIds.ts
git commit -m "feat(toss-mini): persist favorites with apps-in-toss storage"
```

### Task 9: 홈, 지도, 상세, 저장 화면 구현

**Files:**
- Create: `.worktrees/toss-mini/apps/toss-mini/src/features/home/HomeScreen.tsx`
- Create: `.worktrees/toss-mini/apps/toss-mini/src/features/map/MapScreen.tsx`
- Create: `.worktrees/toss-mini/apps/toss-mini/src/features/spot/SpotDetailScreen.tsx`
- Create: `.worktrees/toss-mini/apps/toss-mini/src/features/favorites/FavoritesScreen.tsx`
- Create: `.worktrees/toss-mini/apps/toss-mini/src/ui/Screen.tsx`
- Create: `.worktrees/toss-mini/apps/toss-mini/src/ui/Section.tsx`
- Create: `.worktrees/toss-mini/apps/toss-mini/src/ui/SpotListItem.tsx`
- Create: `.worktrees/toss-mini/apps/toss-mini/src/ui/PrimaryButton.tsx`
- Create: `.worktrees/toss-mini/apps/toss-mini/src/ui/theme.ts`
- Modify: `.worktrees/toss-mini/apps/toss-mini/pages/index.tsx`
- Modify: `.worktrees/toss-mini/apps/toss-mini/pages/spot/[id].tsx`

- [ ] **Step 1: 상세 화면 실패 테스트 작성**

```tsx
import { render } from '@testing-library/react-native';
import { SpotDetailScreen } from '../SpotDetailScreen';

it('명소 기본 정보와 저장 버튼을 렌더링한다', () => {
  const { getByText } = render(
    <SpotDetailScreen
      spot={{ place: '여의도 한강공원', description: '벚꽃 명소', location: '서울 영등포구' }}
      isFavorite={false}
      onToggleFavorite={() => {}}
    />
  );

  expect(getByText('여의도 한강공원')).toBeTruthy();
  expect(getByText('저장하기')).toBeTruthy();
});
```

- [ ] **Step 2: 최소 공용 UI 컴포넌트 작성**

```tsx
export function Screen({ children }: PropsWithChildren) {
  return <View style={{ flex: 1, backgroundColor: '#F7F9F8' }}>{children}</View>;
}
```

- [ ] **Step 3: 홈/지도/상세/저장 화면 구현**

```tsx
// HomeScreen: featured spots + nearby CTA
// MapScreen: NaverMapCanvas + SelectedSpotCard + favorite toggle
// SpotDetailScreen: 정보 + 저장 + 길찾기
// FavoritesScreen: favorite ids 기반 목록
```

- [ ] **Step 4: 라우트 연결**

```tsx
export const Route = createRoute('/', { component: HomePage });
export const Route = createRoute('/spot/:id', { component: SpotDetailPage });
```

- [ ] **Step 5: 타입체크와 앱 테스트**

Run: `cd /Users/user/workspace/flower-map/.worktrees/toss-mini/apps/toss-mini && pnpm test && pnpm typecheck`  
Expected: PASS

- [ ] **Step 6: 커밋**

```bash
git add apps/toss-mini/pages apps/toss-mini/src
git commit -m "feat(toss-mini): implement core mvp screens"
```

### Task 10: 수동 QA와 검증 마감

**Files:**
- Modify: `.worktrees/toss-mini/apps/toss-mini/granite.config.ts` (필요 시 권한/브랜드 마감)
- Modify: `.worktrees/toss-mini/apps/toss-mini/src/features/map/MapScreen.tsx` (실측 이슈 조정)

- [ ] **Step 1: 기능별 수동 QA**

Run:
- `홈 진입 -> 추천 명소 렌더링`
- `지도 진입 -> 지도 렌더링`
- `마커 탭 -> 선택 카드 표시`
- `상세 진입 -> 저장 토글`
- `저장 목록 -> persisted ids 표시`

Expected: 각 시나리오 정상 동작

- [ ] **Step 2: project-validator 기준 자체 체크**

Run: `granite.config.ts, package.json, 권한 설정 재검토`  
Expected: `scheme`, `appName`, `appsInToss` plugin, `permissions` 누락 없음

- [ ] **Step 3: 기존 앱 영향 없음 확인**

Run: `cd /Users/user/workspace/flower-map && git diff -- apps/mobile`  
Expected: no unintended changes

- [ ] **Step 4: 최종 커밋**

```bash
cd /Users/user/workspace/flower-map/.worktrees/toss-mini
git add apps/toss-mini packages
git commit -m "feat(toss-mini): complete apps-in-toss mvp foundation"
```

---

Plan complete and saved to `docs/superpowers/plans/2026-04-03-apps-in-toss-mini.md`. Ready to execute?
