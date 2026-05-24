# 앱스토어 스크린샷 생성기 (Admin) 실행 계획

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 어드민(`apps/web`)에 `/admin/store-assets` 페이지를 추가해, 7개 패널의 앱스토어/플레이스토어 마케팅 스크린샷을 iOS 6.5″(1242×2688)와 Android(1080×1920) 두 가지 사이즈로 PNG/ZIP 다운로드한다.

**Architecture:** 순수 프런트엔드 페이지. 사용자가 폰 내부 화면 스크린샷을 업로드하면, 헤드라인/서브헤드/배경/폰 목업과 합성된 출력 픽셀 사이즈의 DOM을 오프스크린에 렌더링한 뒤 `html-to-image`로 PNG 캡처한다. 미리보기 노드와 추출 노드를 분리해 `transform: scale` 미리보기와 풀해상도 추출이 충돌하지 않도록 한다. 전체 다운로드는 `jszip` + `file-saver`로 묶는다.

**Tech Stack:** Next.js 16(App Router), React 19, TypeScript, Tailwind, Vitest + Testing Library, 신규: `html-to-image`, `jszip`, `file-saver`.

**Spec:** `docs/superpowers/specs/2026-05-20-store-screenshot-generator-design.md`

---

## File Structure

신규 생성:

```
apps/web/
├── app/admin/(dashboard)/store-assets/
│   └── page.tsx                          # 라우트 진입점 (인증만 처리)
└── src/features/store-assets/
    ├── StoreAssetsPage.tsx               # 'use client' 메인 + 14 추출 노드 + 다운로드 핸들러
    ├── panels.ts                         # PanelConfig[] 메타데이터 + 슬러그 유니크 dev 어설션
    ├── panels.test.ts                    # 메타데이터 단위 테스트
    ├── designTokens.ts                   # DESIGN_SIZE 상수 + 플랫폼별 폰 오프셋
    ├── PhoneFrame.tsx                    # 9:19.5 폰 목업 (검정 라운드 + 다이내믹 아일랜드)
    ├── PanelCanvas.tsx                   # 실제 출력 픽셀의 패널 DOM
    ├── PanelCanvas.test.tsx              # 플랫폼별 width/height 스모크 테스트
    ├── PanelCard.tsx                     # 카드: 축소 미리보기 + 업로드 + 다운로드 버튼 (자체 추출 노드 없음)
    ├── PlatformToggle.tsx                # iOS/Android 토글
    ├── exportPng.ts                      # toPng 캡처 유틸 (폰트/이미지 readiness 포함)
    ├── exportZip.ts                      # ZIP 묶음 유틸 + formatDateYYYYMMDD
    ├── exportZip.test.ts                 # formatDateYYYYMMDD 단위 테스트
    └── readImageFile.ts                  # File → dataURL 변환 유틸
```

수정:
- `apps/web/src/features/dashboard/AdminSidebar.tsx` — 사이드바 메뉴 1줄 추가
- `apps/web/app/admin/(dashboard)/layout.tsx` — Pretendard 웹폰트 link 추가 (캡처 일관성)
- `apps/web/package.json` — `html-to-image`, `jszip`, `file-saver` + `@types/file-saver` 추가

## 작업 원칙

- TDD를 유지하되, 시각 출력에 본질이 있는 컴포넌트(`PhoneFrame`, `PanelCanvas`)는 **얇은 스모크 테스트**만 작성한다. 헤드리스 환경에서 html-to-image/jszip 동작은 mock한다(jsdom 한계).
- 각 태스크 끝에 빌드/타입체크 통과를 확인한 뒤 커밋한다. 커밋 메시지는 한국어 prefix(`feat(web): ...`, `test(web): ...`).
- 신규 deps는 admin 페이지에서만 사용되므로 핸들러 내 `await import()`로 lazy load 한다.

---

## Chunk 1: 기반 구조 (의존성, 메타데이터, 디자인 토큰)

### Task 1: 신규 의존성 추가

**Files:**
- Modify: `apps/web/package.json`

- [ ] **Step 1: 의존성 설치 (워크스페이스 단위)**

Run from repo root:
```bash
pnpm --filter flower-map-web add html-to-image jszip file-saver
pnpm --filter flower-map-web add -D @types/file-saver
```

Expected: `apps/web/package.json`의 `dependencies`에 `html-to-image`, `jszip`, `file-saver`가, `devDependencies`에 `@types/file-saver`가 추가되어야 한다.

- [ ] **Step 2: 설치 검증**

Run:
```bash
pnpm --filter flower-map-web exec tsc --noEmit
```
Expected: 통과(아직 신규 코드 없음).

- [ ] **Step 3: 커밋**

```bash
git add apps/web/package.json pnpm-lock.yaml
git commit -m "chore(web): 스토어 스크린샷 생성기용 의존성 추가 (html-to-image, jszip, file-saver)"
```

---

### Task 2: 디자인 토큰 정의

**Files:**
- Create: `apps/web/src/features/store-assets/designTokens.ts`

- [ ] **Step 1: 토큰 파일 작성**

플랫폼별 캔버스 비율이 다르므로(iOS 9:19.5 vs Android 9:16) 폰 가로 비율과 하단 잘림 비율을 분기한다. Android는 캔버스 세로가 더 짧아 폰을 작게 그리고 적게 잘라야 헤드라인 영역과 겹치지 않는다.

Create `apps/web/src/features/store-assets/designTokens.ts`:

```ts
export type Platform = 'ios' | 'android';

export const DESIGN_SIZE: Record<Platform, { width: number; height: number }> = {
  ios: { width: 1242, height: 2688 },
  android: { width: 1080, height: 1920 },
};

export const PLATFORM_LABEL: Record<Platform, string> = {
  ios: 'iOS 6.5″',
  android: 'Android',
};

// 폰 프레임은 양 플랫폼 동일하게 9:19.5 비율(iPhone 비례).
export const PHONE_FRAME = {
  aspect: 19.5 / 9, // height / width
  cornerRadiusRatio: 0.07,
  bezelRatio: 0.012,
};

/** 플랫폼별 폰 배치 계수. 캔버스 폭 대비 폰 폭(widthRatio)과 캔버스 세로 대비 하단 잘림 비율(bottomCutRatio)을 분기한다. */
export const PHONE_LAYOUT: Record<Platform, { widthRatio: number; bottomCutRatio: number }> = {
  // iOS(1242×2688, 비율 ~2.16): 폰 770×1668, 폰 상단 ≈ 720px, 헤드라인 영역 ≈ 600px → 안전 여백 120px
  ios: { widthRatio: 0.62, bottomCutRatio: 0.11 },
  // Android(1080×1920, 비율 ~1.78): 폰을 더 좁게(560×1213) + 잘림 비율 축소 → 폰 상단 ≈ 870px, 헤드라인 영역 ≈ 430px → 안전 여백 440px
  android: { widthRatio: 0.52, bottomCutRatio: 0.08 },
};

export const TYPO = {
  headlinePx: 110,
  headlineLineHeight: 1.15,
  headlineWeight: 800,
  subheadPx: 52,
  subheadLineHeight: 1.3,
  subheadWeight: 500,
  subheadColor: '#6B5B5B',
  newBadgePx: 48,
  newBadgePadX: 0.034,
  newBadgePadY: 0.016,
  newBadgeBg: '#FF7B9C',
  newBadgeFg: '#FFFFFF',
};
```

- [ ] **Step 2: 타입체크**

Run: `pnpm --filter flower-map-web exec tsc --noEmit`
Expected: 통과.

- [ ] **Step 3: 커밋**

```bash
git add apps/web/src/features/store-assets/designTokens.ts
git commit -m "feat(web): 스토어 스크린샷 디자인 토큰 정의"
```

---

### Task 3: 패널 메타데이터 + 유니크 어설션 (TDD)

**Files:**
- Create: `apps/web/src/features/store-assets/panels.ts`
- Test: `apps/web/src/features/store-assets/panels.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

Create `apps/web/src/features/store-assets/panels.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { PANELS, type PanelConfig } from './panels';

describe('PANELS', () => {
  it('7개의 패널을 정의한다', () => {
    expect(PANELS).toHaveLength(7);
  });

  it('1번 패널은 NEW 호텔 패널이다', () => {
    expect(PANELS[0]?.slug).toBe('hotel');
    expect(PANELS[0]?.isNew).toBe(true);
  });

  it('순서는 1~7이 빠짐없이 채워진다', () => {
    const indices = PANELS.map((p) => p.index).sort((a, b) => a - b);
    expect(indices).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('슬러그는 유니크하다', () => {
    const slugs = PANELS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('모든 패널이 헤드라인/서브헤드/배경을 갖는다', () => {
    PANELS.forEach((p: PanelConfig) => {
      expect(p.headline.length).toBeGreaterThan(0);
      expect(p.subhead.length).toBeGreaterThan(0);
      expect(p.background.length).toBeGreaterThan(0);
    });
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm --filter flower-map-web exec vitest run src/features/store-assets/panels.test.ts`
Expected: FAIL (모듈 없음).

- [ ] **Step 3: 메타데이터 구현**

Create `apps/web/src/features/store-assets/panels.ts`:

```ts
export type PanelConfig = {
  index: number;
  slug: string;
  headline: string;
  subhead: string;
  isNew?: boolean;
  background: string;
  flowerAccent?: 'sakura' | 'lilac' | 'none';
};

export const PANELS: readonly PanelConfig[] = [
  {
    index: 1,
    slug: 'hotel',
    headline: '명소와 한번에 호텔까지',
    subhead: '꽃 명소 주변 숙소를 바로 예약',
    isNew: true,
    background: '#E6DCEE',
    flowerAccent: 'lilac',
  },
  {
    index: 2,
    slug: 'detail',
    headline: '명소 상세를 풍부하게',
    subhead: '영상과 블로그 글을 함께 확인',
    background: '#FCE4EC',
    flowerAccent: 'sakura',
  },
  {
    index: 3,
    slug: 'home',
    headline: '오늘, 꽃 보러 갈까?',
    subhead: '지금 피는 꽃을 한 눈에',
    background: '#F7C8D4',
    flowerAccent: 'sakura',
  },
  {
    index: 4,
    slug: 'bloom',
    headline: '실시간 개화정보',
    subhead: '전국 명소 개화율을 한 화면에',
    background: '#FCE0C8',
    flowerAccent: 'sakura',
  },
  {
    index: 5,
    slug: 'nearby',
    headline: '주변 꽃 명소 추천',
    subhead: '현재 위치 기반 명소 지도',
    background: '#D6EDD9',
    flowerAccent: 'none',
  },
  {
    index: 6,
    slug: 'direction',
    headline: '길찾기까지 한번에',
    subhead: '지금 바로 찾아가는 꽃 나들이',
    background: '#DDD6F0',
    flowerAccent: 'none',
  },
  {
    index: 7,
    slug: 'saved',
    headline: '나만의 꽃 명소',
    subhead: '다시 찾고 싶은 장소 쉽게 저장',
    background: '#F0E6D2',
    flowerAccent: 'sakura',
  },
];

if (process.env.NODE_ENV !== 'production') {
  const slugs = PANELS.map((p) => p.slug);
  if (new Set(slugs).size !== slugs.length) {
    throw new Error(`[store-assets/panels] 슬러그 중복 발견: ${slugs.join(', ')}`);
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm --filter flower-map-web exec vitest run src/features/store-assets/panels.test.ts`
Expected: PASS (5건).

- [ ] **Step 5: 커밋**

```bash
git add apps/web/src/features/store-assets/panels.ts apps/web/src/features/store-assets/panels.test.ts
git commit -m "feat(web): 스토어 스크린샷 7개 패널 메타데이터 정의"
```

---

## Chunk 2: 시각 컴포넌트 (PhoneFrame, PanelCanvas)

### Task 4: PhoneFrame 컴포넌트

**Files:**
- Create: `apps/web/src/features/store-assets/PhoneFrame.tsx`

- [ ] **Step 1: 컴포넌트 작성**

Create `apps/web/src/features/store-assets/PhoneFrame.tsx`:

```tsx
import React from 'react';

import { PHONE_FRAME } from './designTokens';

type PhoneFrameProps = {
  width: number;
  screenshotDataUrl: string | null;
};

/**
 * 9:19.5 비율의 검정 라운드 폰 목업. 다이내믹 아일랜드 포함.
 * 모든 사이즈는 props.width 기준으로 비율 계산되어 캔버스 스케일에 의존하지 않는다.
 */
export function PhoneFrame({ width, screenshotDataUrl }: PhoneFrameProps) {
  const height = width * PHONE_FRAME.aspect;
  const corner = width * PHONE_FRAME.cornerRadiusRatio;
  const bezel = width * PHONE_FRAME.bezelRatio;
  const innerWidth = width - bezel * 2;
  const innerHeight = height - bezel * 2;
  const innerCorner = corner - bezel;

  const islandWidth = width * 0.32;
  const islandHeight = width * 0.08;
  const islandTop = bezel + width * 0.025;

  return (
    <div
      style={{
        width,
        height,
        background: '#0a0a0a',
        borderRadius: corner,
        position: 'relative',
        boxShadow: '0 30px 60px rgba(0,0,0,0.18)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: bezel,
          left: bezel,
          width: innerWidth,
          height: innerHeight,
          borderRadius: innerCorner,
          overflow: 'hidden',
          background: screenshotDataUrl ? '#ffffff' : '#f3f3f3',
        }}
      >
        {screenshotDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={screenshotDataUrl}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: width * 0.04,
              color: '#9b9b9b',
            }}
          >
            스크린샷 업로드
          </div>
        )}
      </div>
      <div
        style={{
          position: 'absolute',
          top: islandTop,
          left: (width - islandWidth) / 2,
          width: islandWidth,
          height: islandHeight,
          background: '#0a0a0a',
          borderRadius: islandHeight / 2,
        }}
      />
    </div>
  );
}
```

- [ ] **Step 2: 타입체크**

Run: `pnpm --filter flower-map-web exec tsc --noEmit`
Expected: 통과.

- [ ] **Step 3: 커밋**

```bash
git add apps/web/src/features/store-assets/PhoneFrame.tsx
git commit -m "feat(web): 스토어 스크린샷용 PhoneFrame 컴포넌트 추가"
```

---

### Task 5: PanelCanvas 컴포넌트 (TDD 스모크 테스트)

**Files:**
- Create: `apps/web/src/features/store-assets/PanelCanvas.tsx`
- Test: `apps/web/src/features/store-assets/PanelCanvas.test.tsx`

- [ ] **Step 1: 실패하는 스모크 테스트 작성**

Create `apps/web/src/features/store-assets/PanelCanvas.test.tsx`:

```tsx
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PanelCanvas } from './PanelCanvas';
import { PANELS } from './panels';

describe('PanelCanvas', () => {
  const panel = PANELS[0]!;

  it('iOS 플랫폼에서 1242×2688 사이즈로 렌더한다', () => {
    const { container } = render(
      <PanelCanvas panel={panel} platform="ios" screenshotDataUrl={null} />,
    );
    const root = container.firstChild as HTMLElement;
    expect(root.style.width).toBe('1242px');
    expect(root.style.height).toBe('2688px');
  });

  it('Android 플랫폼에서 1080×1920 사이즈로 렌더한다', () => {
    const { container } = render(
      <PanelCanvas panel={panel} platform="android" screenshotDataUrl={null} />,
    );
    const root = container.firstChild as HTMLElement;
    expect(root.style.width).toBe('1080px');
    expect(root.style.height).toBe('1920px');
  });

  it('NEW 패널은 NEW 배지를 렌더한다', () => {
    const { getByTestId } = render(
      <PanelCanvas panel={panel} platform="ios" screenshotDataUrl={null} />,
    );
    expect(getByTestId('new-badge').textContent).toBe('NEW');
  });

  it('헤드라인과 서브헤드를 렌더한다', () => {
    const { getByText } = render(
      <PanelCanvas panel={panel} platform="ios" screenshotDataUrl={null} />,
    );
    expect(getByText(panel.headline)).toBeDefined();
    expect(getByText(panel.subhead)).toBeDefined();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm --filter flower-map-web exec vitest run src/features/store-assets/PanelCanvas.test.tsx`
Expected: FAIL (모듈 없음).

- [ ] **Step 3: 컴포넌트 구현**

Create `apps/web/src/features/store-assets/PanelCanvas.tsx`:

```tsx
import React from 'react';

import { DESIGN_SIZE, PHONE_FRAME, PHONE_LAYOUT, TYPO, type Platform } from './designTokens';
import { PhoneFrame } from './PhoneFrame';
import type { PanelConfig } from './panels';

type PanelCanvasProps = {
  panel: PanelConfig;
  platform: Platform;
  screenshotDataUrl: string | null;
};

export function PanelCanvas({ panel, platform, screenshotDataUrl }: PanelCanvasProps) {
  const { width, height } = DESIGN_SIZE[platform];
  const layout = PHONE_LAYOUT[platform];
  const phoneWidth = width * layout.widthRatio;
  const phoneHeight = phoneWidth * PHONE_FRAME.aspect;
  const headlinePadding = width * 0.07;

  return (
    <div
      data-panel-slug={panel.slug}
      data-platform={platform}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        background: panel.background,
        position: 'relative',
        overflow: 'hidden',
        fontFamily:
          'Pretendard, "Pretendard Variable", -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", system-ui, sans-serif',
        color: '#1f1f1f',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: height * 0.08,
          left: headlinePadding,
          right: headlinePadding,
          display: 'flex',
          flexDirection: 'column',
          gap: width * 0.025,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: width * 0.02, flexWrap: 'wrap' }}>
          <h1
            style={{
              margin: 0,
              fontSize: TYPO.headlinePx,
              lineHeight: TYPO.headlineLineHeight,
              fontWeight: TYPO.headlineWeight,
              letterSpacing: '-0.02em',
            }}
          >
            {panel.headline}
          </h1>
          {panel.isNew ? (
            <span
              data-testid="new-badge"
              style={{
                display: 'inline-block',
                padding: `${width * TYPO.newBadgePadY}px ${width * TYPO.newBadgePadX}px`,
                fontSize: TYPO.newBadgePx,
                fontWeight: 800,
                color: TYPO.newBadgeFg,
                background: TYPO.newBadgeBg,
                borderRadius: 999,
              }}
            >
              NEW
            </span>
          ) : null}
        </div>
        <p
          style={{
            margin: 0,
            fontSize: TYPO.subheadPx,
            lineHeight: TYPO.subheadLineHeight,
            fontWeight: TYPO.subheadWeight,
            color: TYPO.subheadColor,
          }}
        >
          {panel.subhead}
        </p>
      </div>

      {/* 폰을 캔버스 하단에 배치. bottomCutRatio만큼 캔버스 세로 기준으로 잘림. */}
      <div
        style={{
          position: 'absolute',
          top: height - phoneHeight + height * layout.bottomCutRatio,
          left: (width - phoneWidth) / 2,
        }}
      >
        <PhoneFrame width={phoneWidth} screenshotDataUrl={screenshotDataUrl} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm --filter flower-map-web exec vitest run src/features/store-assets/PanelCanvas.test.tsx`
Expected: PASS (4건).

- [ ] **Step 5: 커밋**

```bash
git add apps/web/src/features/store-assets/PanelCanvas.tsx apps/web/src/features/store-assets/PanelCanvas.test.tsx
git commit -m "feat(web): 스토어 스크린샷 PanelCanvas 컴포넌트 추가"
```

---

## Chunk 3: 다운로드 유틸리티 (PNG/ZIP, 파일 읽기)

### Task 6: 이미지 파일 dataURL 변환 유틸

**Files:**
- Create: `apps/web/src/features/store-assets/readImageFile.ts`

- [ ] **Step 1: 유틸 작성**

스펙 §10에 따라 10MB 초과 시 **경고만 하고 그대로 사용**한다(차단 X). 이미지 포맷이 아닌 경우만 차단.

Create `apps/web/src/features/store-assets/readImageFile.ts`:

```ts
export const LARGE_FILE_WARN_BYTES = 10 * 1024 * 1024; // 10MB 경고선

export type ReadImageResult = { dataUrl: string; warning: string | null };

export async function readImageFile(file: File): Promise<ReadImageResult> {
  if (!file.type.startsWith('image/')) {
    throw new Error(`이미지 파일이 아닙니다: ${file.type || '알 수 없음'}`);
  }

  const warning =
    file.size > LARGE_FILE_WARN_BYTES
      ? `큰 파일입니다(${(file.size / 1024 / 1024).toFixed(1)}MB). 그대로 사용합니다.`
      : null;

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('파일을 읽지 못했습니다.'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('파일 읽기 실패'));
    reader.readAsDataURL(file);
  });

  return { dataUrl, warning };
}
```

- [ ] **Step 2: 타입체크**

Run: `pnpm --filter flower-map-web exec tsc --noEmit`
Expected: 통과.

- [ ] **Step 3: 커밋**

```bash
git add apps/web/src/features/store-assets/readImageFile.ts
git commit -m "feat(web): 스토어 스크린샷 이미지 파일 → dataURL 변환 유틸"
```

---

### Task 7: PNG 추출 유틸 (폰트/이미지 readiness 포함)

**Files:**
- Create: `apps/web/src/features/store-assets/exportPng.ts`

- [ ] **Step 1: 유틸 작성**

Create `apps/web/src/features/store-assets/exportPng.ts`:

```ts
/**
 * 추출 대상 노드를 PNG Blob으로 캡처한다.
 *
 * 사전 조건:
 * - 노드는 실제 출력 픽셀 사이즈로 렌더링되어 있어야 한다(예: 1242×2688).
 * - 노드는 transform이 걸리지 않은 컨테이너에 마운트되어 있어야 한다(미리보기 노드 금지).
 *
 * 캡처 전:
 * - document.fonts.ready 를 await 해 웹폰트 로딩 보장.
 * - 내부 <img>들의 decode()를 await 해 디코드 완료 보장.
 */
export async function captureNodeToPng(node: HTMLElement, width: number, height: number): Promise<Blob> {
  if (typeof document !== 'undefined' && 'fonts' in document) {
    await document.fonts.ready;
  }

  const images = Array.from(node.querySelectorAll('img'));
  await Promise.all(
    images.map(async (img) => {
      if (img.complete && img.naturalWidth > 0) return;
      if (typeof img.decode === 'function') {
        try {
          await img.decode();
        } catch {
          // decode 실패해도 onload 대기로 폴백
          await new Promise<void>((resolve) => {
            img.addEventListener('load', () => resolve(), { once: true });
            img.addEventListener('error', () => resolve(), { once: true });
          });
        }
      }
    }),
  );

  const { toBlob } = await import('html-to-image');
  const blob = await toBlob(node, { pixelRatio: 1, width, height, cacheBust: true });
  if (!blob) {
    throw new Error('PNG 생성에 실패했습니다.');
  }
  return blob;
}
```

- [ ] **Step 2: 타입체크**

Run: `pnpm --filter flower-map-web exec tsc --noEmit`
Expected: 통과.

- [ ] **Step 3: 커밋**

```bash
git add apps/web/src/features/store-assets/exportPng.ts
git commit -m "feat(web): 스토어 스크린샷 PNG 캡처 유틸 (폰트/이미지 readiness 포함)"
```

---

### Task 8: ZIP 묶음 유틸 + 날짜 포매터 (TDD)

**Files:**
- Create: `apps/web/src/features/store-assets/exportZip.ts`
- Test: `apps/web/src/features/store-assets/exportZip.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

Create `apps/web/src/features/store-assets/exportZip.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { formatDateYYYYMMDD } from './exportZip';

describe('formatDateYYYYMMDD', () => {
  it('한자리 월/일은 0으로 패딩한다', () => {
    expect(formatDateYYYYMMDD(new Date(2026, 0, 5))).toBe('20260105');
  });
  it('12월 31일을 올바르게 포맷한다', () => {
    expect(formatDateYYYYMMDD(new Date(2026, 11, 31))).toBe('20261231');
  });
  it('두자리 월/일은 그대로 둔다', () => {
    expect(formatDateYYYYMMDD(new Date(2026, 9, 20))).toBe('20261020');
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm --filter flower-map-web exec vitest run src/features/store-assets/exportZip.test.ts`
Expected: FAIL (모듈 없음).

- [ ] **Step 3: 유틸 작성**

Create `apps/web/src/features/store-assets/exportZip.ts`:

```ts
import type { Platform } from './designTokens';

export type ZipEntry = {
  platform: Platform;
  filename: string; // 예: "ios-1-hotel.png"
  blob: Blob;
};

/**
 * 14장(iOS 7 + Android 7) blob을 ios/ android/ 폴더로 분리한 ZIP으로 묶어 다운로드한다.
 */
export async function downloadAsZip(entries: ZipEntry[], dateStr: string): Promise<void> {
  const [{ default: JSZip }, { saveAs }] = await Promise.all([
    import('jszip'),
    import('file-saver'),
  ]);

  const zip = new JSZip();
  const iosFolder = zip.folder('ios');
  const androidFolder = zip.folder('android');
  if (!iosFolder || !androidFolder) {
    throw new Error('ZIP 폴더 생성 실패');
  }

  for (const entry of entries) {
    const folder = entry.platform === 'ios' ? iosFolder : androidFolder;
    folder.file(entry.filename, entry.blob);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  saveAs(zipBlob, `store-assets-${dateStr}.zip`);
}

export function formatDateYYYYMMDD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm --filter flower-map-web exec vitest run src/features/store-assets/exportZip.test.ts`
Expected: PASS (3건).

- [ ] **Step 5: 커밋**

```bash
git add apps/web/src/features/store-assets/exportZip.ts apps/web/src/features/store-assets/exportZip.test.ts
git commit -m "feat(web): 스토어 스크린샷 ZIP 묶음 유틸"
```

---

## Chunk 4: UI 컴포넌트 (PlatformToggle, PanelCard, StoreAssetsPage)

### Task 9: PlatformToggle

**Files:**
- Create: `apps/web/src/features/store-assets/PlatformToggle.tsx`

- [ ] **Step 1: 컴포넌트 작성**

Create `apps/web/src/features/store-assets/PlatformToggle.tsx`:

```tsx
'use client';

import React from 'react';

import { PLATFORM_LABEL, type Platform } from './designTokens';

type Props = {
  value: Platform;
  onChange: (next: Platform) => void;
};

export function PlatformToggle({ value, onChange }: Props) {
  const platforms: Platform[] = ['ios', 'android'];
  return (
    <div
      role="tablist"
      aria-label="플랫폼 선택"
      className="inline-flex rounded-full border border-border bg-background p-1 text-sm"
    >
      {platforms.map((p) => {
        const active = value === p;
        return (
          <button
            key={p}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(p)}
            className={
              'px-4 py-1.5 rounded-full transition ' +
              (active
                ? 'bg-foreground text-background font-semibold'
                : 'text-muted-foreground hover:text-foreground')
            }
          >
            {PLATFORM_LABEL[p]}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: 타입체크**

Run: `pnpm --filter flower-map-web exec tsc --noEmit`
Expected: 통과.

- [ ] **Step 3: 커밋**

```bash
git add apps/web/src/features/store-assets/PlatformToggle.tsx
git commit -m "feat(web): 스토어 스크린샷 PlatformToggle 추가"
```

---

### Task 10: PanelCard (업로드 + 미리보기 + 다운로드 버튼)

**설계 노트:** 카드는 자체 추출 노드를 가지지 않는다. 부모(`StoreAssetsPage`)가 14개 추출 노드를 단일 소스로 보유하고, 카드의 PNG 다운로드 버튼은 부모가 내려준 `onDownload(slug)` 콜백을 호출한다. 이렇게 하면 추출 노드 28개 → 14개로 줄고 데드 코드가 사라진다.

**Files:**
- Create: `apps/web/src/features/store-assets/PanelCard.tsx`

- [ ] **Step 1: 컴포넌트 작성**

Create `apps/web/src/features/store-assets/PanelCard.tsx`:

```tsx
'use client';

import React, { useId, useState } from 'react';

import { DESIGN_SIZE, type Platform } from './designTokens';
import { PanelCanvas } from './PanelCanvas';
import type { PanelConfig } from './panels';
import { readImageFile } from './readImageFile';

type Props = {
  panel: PanelConfig;
  platform: Platform;
  screenshotDataUrl: string | null;
  onScreenshotChange: (next: string | null) => void;
  onDownload: (slug: string) => Promise<void>;
  isDownloading: boolean;
};

const PREVIEW_SCALE = 0.18;

export function PanelCard({
  panel,
  platform,
  screenshotDataUrl,
  onScreenshotChange,
  onDownload,
  isDownloading,
}: Props) {
  const inputId = useId();
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const { width, height } = DESIGN_SIZE[platform];

  async function handleFile(file: File) {
    setError(null);
    setWarning(null);
    try {
      const { dataUrl, warning: w } = await readImageFile(file);
      onScreenshotChange(dataUrl);
      if (w) setWarning(w);
    } catch (e) {
      setError(e instanceof Error ? e.message : '파일을 읽지 못했습니다.');
    }
  }

  async function handleDownloadClick() {
    setError(null);
    try {
      await onDownload(panel.slug);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'PNG 생성 실패');
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="text-sm font-semibold">
          {panel.index}. {panel.headline}
        </div>
        {panel.isNew ? (
          <span className="inline-block rounded-full bg-[#FF7B9C] px-2 py-0.5 text-[10px] font-bold text-white">
            NEW
          </span>
        ) : null}
      </div>

      {/* 미리보기 (축소). 추출용 노드는 부모가 보유. */}
      <div
        aria-label={`${panel.slug} 미리보기`}
        style={{
          width: width * PREVIEW_SCALE,
          height: height * PREVIEW_SCALE,
          overflow: 'hidden',
          borderRadius: 12,
        }}
        className="border border-border self-center"
      >
        <div
          style={{
            width,
            height,
            transform: `scale(${PREVIEW_SCALE})`,
            transformOrigin: 'top left',
          }}
        >
          <PanelCanvas panel={panel} platform={platform} screenshotDataUrl={screenshotDataUrl} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id={inputId}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = '';
          }}
        />
        <label
          htmlFor={inputId}
          className="cursor-pointer rounded-full border border-border px-3 py-1.5 text-xs hover:bg-muted/20"
        >
          {screenshotDataUrl ? '교체' : '업로드'}
        </label>
        {screenshotDataUrl ? (
          <button
            type="button"
            onClick={() => onScreenshotChange(null)}
            className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/20"
          >
            제거
          </button>
        ) : null}
        <button
          type="button"
          onClick={handleDownloadClick}
          disabled={isDownloading}
          aria-busy={isDownloading}
          className="ml-auto rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-background disabled:opacity-50"
        >
          {isDownloading ? '생성 중…' : 'PNG 다운로드'}
        </button>
      </div>

      {warning ? <p className="text-xs text-amber-700">{warning}</p> : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
```

- [ ] **Step 2: 타입체크**

Run: `pnpm --filter flower-map-web exec tsc --noEmit`
Expected: 통과.

- [ ] **Step 3: 커밋**

```bash
git add apps/web/src/features/store-assets/PanelCard.tsx
git commit -m "feat(web): 스토어 스크린샷 PanelCard (업로드/미리보기/PNG 다운로드)"
```

---

### Task 11: StoreAssetsPage 메인 컴포넌트

**설계 노트:** 추출 노드 14개(iOS 7 + Android 7)를 부모가 단일 소스로 보유한다. 단건 다운로드(PNG 버튼)와 ZIP 다운로드 모두 이 14노드에서 캡처한다. PanelCard는 다운로드 트리거만 보낸다.

**Files:**
- Create: `apps/web/src/features/store-assets/StoreAssetsPage.tsx`

- [ ] **Step 1: 컴포넌트 작성**

Create `apps/web/src/features/store-assets/StoreAssetsPage.tsx`:

```tsx
'use client';

import React, { useCallback, useRef, useState } from 'react';

import { DashboardShell } from '@/features/dashboard/DashboardShell';

import { DESIGN_SIZE, type Platform } from './designTokens';
import { PanelCanvas } from './PanelCanvas';
import { PanelCard } from './PanelCard';
import { PANELS } from './panels';
import { PlatformToggle } from './PlatformToggle';
import { captureNodeToPng } from './exportPng';
import { downloadAsZip, formatDateYYYYMMDD, type ZipEntry } from './exportZip';

function nodeKey(platform: Platform, slug: string): string {
  return `${platform}-${slug}`;
}

export function StoreAssetsPage() {
  const [platform, setPlatform] = useState<Platform>('ios');
  const [screenshots, setScreenshots] = useState<Record<string, string | null>>({});
  const [zipBusy, setZipBusy] = useState(false);
  const [downloadingSlug, setDownloadingSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 14개 추출 노드를 부모가 단일 소스로 보유.
  const nodesRef = useRef<Record<string, HTMLDivElement | null>>({});

  const handleDownloadSingle = useCallback(
    async (slug: string) => {
      const panel = PANELS.find((p) => p.slug === slug);
      if (!panel) throw new Error(`알 수 없는 패널: ${slug}`);
      const node = nodesRef.current[nodeKey(platform, slug)];
      if (!node) throw new Error(`추출 노드 누락: ${nodeKey(platform, slug)}`);
      const { width, height } = DESIGN_SIZE[platform];
      setDownloadingSlug(slug);
      setError(null);
      try {
        const blob = await captureNodeToPng(node, width, height);
        const { saveAs } = await import('file-saver');
        saveAs(blob, `${platform}-${panel.index}-${panel.slug}.png`);
      } finally {
        setDownloadingSlug(null);
      }
    },
    [platform],
  );

  async function handleDownloadAll() {
    setZipBusy(true);
    setError(null);
    try {
      const entries: ZipEntry[] = [];
      for (const p of ['ios', 'android'] as Platform[]) {
        const { width, height } = DESIGN_SIZE[p];
        for (const panel of PANELS) {
          const node = nodesRef.current[nodeKey(p, panel.slug)];
          if (!node) throw new Error(`추출 노드 누락: ${nodeKey(p, panel.slug)}`);
          const blob = await captureNodeToPng(node, width, height);
          entries.push({
            platform: p,
            filename: `${p}-${panel.index}-${panel.slug}.png`,
            blob,
          });
        }
      }
      await downloadAsZip(entries, formatDateYYYYMMDD(new Date()));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ZIP 생성 실패');
    } finally {
      setZipBusy(false);
    }
  }

  return (
    <DashboardShell
      title="스토어 스크린샷"
      description="앱스토어/플레이스토어 마케팅 스크린샷을 패널별로 또는 일괄로 다운로드합니다."
      actions={
        <div className="flex items-center gap-3">
          <PlatformToggle value={platform} onChange={setPlatform} />
          <button
            type="button"
            onClick={handleDownloadAll}
            disabled={zipBusy}
            aria-busy={zipBusy}
            className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background disabled:opacity-50"
          >
            {zipBusy ? 'ZIP 생성 중…' : '전체 ZIP 다운로드'}
          </button>
        </div>
      }
    >
      {error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {PANELS.map((panel) => (
          <PanelCard
            key={panel.slug}
            panel={panel}
            platform={platform}
            screenshotDataUrl={screenshots[panel.slug] ?? null}
            onScreenshotChange={(next) =>
              setScreenshots((prev) => ({ ...prev, [panel.slug]: next }))
            }
            onDownload={handleDownloadSingle}
            isDownloading={downloadingSlug === panel.slug}
          />
        ))}
      </div>

      {/* 14개 추출 노드 (iOS×7 + Android×7). 단건/ZIP 다운로드 모두 이 노드에서 캡처. */}
      <div
        style={{ position: 'fixed', left: '-99999px', top: 0, pointerEvents: 'none' }}
        aria-hidden
      >
        {(['ios', 'android'] as Platform[]).map((p) =>
          PANELS.map((panel) => {
            const key = nodeKey(p, panel.slug);
            return (
              <div
                key={key}
                ref={(el) => {
                  nodesRef.current[key] = el;
                }}
              >
                <PanelCanvas
                  panel={panel}
                  platform={p}
                  screenshotDataUrl={screenshots[panel.slug] ?? null}
                />
              </div>
            );
          }),
        )}
      </div>
    </DashboardShell>
  );
}
```

- [ ] **Step 2: 타입체크**

Run: `pnpm --filter flower-map-web exec tsc --noEmit`
Expected: 통과.

- [ ] **Step 3: 커밋**

```bash
git add apps/web/src/features/store-assets/StoreAssetsPage.tsx
git commit -m "feat(web): 스토어 스크린샷 메인 페이지 컴포넌트 (패널 그리드 + 전체 ZIP)"
```

---

## Chunk 5: 라우팅, 사이드바 연결, 폰트 로드

### Task 11.5: Pretendard 웹폰트 로드

**배경:** 현재 `apps/web/app/globals.css`는 폰트 패밀리에 `Pretendard, "Pretendard Variable"`를 fallback 체인으로 지정만 해두고 실제 폰트 파일은 어디서도 로드하지 않는다. 따라서 `document.fonts.ready`는 즉시 resolve되고 캡처 시 시스템 폰트(macOS는 Apple SD Gothic Neo)가 사용된다. 사용자 환경에 따라 캡처 결과가 달라지는 것을 막기 위해 어드민 페이지에서 Pretendard를 명시 로드한다.

**Files:**
- Modify: `apps/web/app/admin/(dashboard)/layout.tsx`

- [ ] **Step 1: 어드민 dashboard layout에 Pretendard CDN link 추가**

Read current file first to confirm structure (it's a Server Component). Then modify to inject the font link via Next.js `<link>` (또는 `next/font/local`은 별도 파일 호스팅이 필요하므로 CDN 사용).

Edit `apps/web/app/admin/(dashboard)/layout.tsx`. 기존 구조:

```tsx
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const { isAdmin, user } = await getAdminAccessState(supabase as never);

  if (user == null || !isAdmin) {
    redirect('/login');
  }

  return children;
}
```

다음과 같이 변경:

```tsx
import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';

import { getAdminAccessState } from '@/lib/auth/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const { isAdmin, user } = await getAdminAccessState(supabase as never);

  if (user == null || !isAdmin) {
    redirect('/login');
  }

  return (
    <>
      <link
        rel="stylesheet"
        as="style"
        crossOrigin="anonymous"
        href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
      />
      {children}
    </>
  );
}
```

> Next.js App Router는 `<link>`를 컴포넌트 트리 내에 두면 자동으로 `<head>`로 호이스팅한다.

- [ ] **Step 2: 타입체크**

Run: `pnpm --filter flower-map-web exec tsc --noEmit`
Expected: 통과.

- [ ] **Step 3: 커밋**

```bash
git add apps/web/app/admin/\(dashboard\)/layout.tsx
git commit -m "feat(web): 어드민 대시보드에 Pretendard 웹폰트 로드 (스토어 스크린샷 캡처 일관성)"
```

---

### Task 12: 라우트 페이지

**Files:**
- Create: `apps/web/app/admin/(dashboard)/store-assets/page.tsx`

- [ ] **Step 1: 라우트 작성**

Next.js 15+에서 `next/dynamic`의 `ssr: false`는 Client Component에서만 허용된다. 라우트 페이지를 Server Component로 유지하면서 `StoreAssetsPage`를 직접 import 한다 — `StoreAssetsPage` 자체가 `'use client'`이므로 RSC 경계에서 자동으로 클라이언트 컴포넌트가 되며, 라우트가 분리되어 있어 메인 번들에는 영향이 없다.

Create `apps/web/app/admin/(dashboard)/store-assets/page.tsx`:

```tsx
import { StoreAssetsPage } from '@/features/store-assets/StoreAssetsPage';

export default function Page() {
  return <StoreAssetsPage />;
}
```

- [ ] **Step 2: 빌드 확인**

Run: `pnpm --filter flower-map-web exec tsc --noEmit`
Expected: 통과.

- [ ] **Step 3: 커밋**

```bash
git add apps/web/app/admin/\(dashboard\)/store-assets/page.tsx
git commit -m "feat(web): /admin/store-assets 라우트 추가"
```

---

### Task 13: 사이드바 메뉴 항목 추가

**Files:**
- Modify: `apps/web/src/features/dashboard/AdminSidebar.tsx`

- [ ] **Step 1: 메뉴 항목 추가**

Edit `apps/web/src/features/dashboard/AdminSidebar.tsx`. 기존 `primaryNavItems` 배열의 `{ href: '/admin/settings', label: '설정' }` **앞에** 다음 항목을 삽입:

```ts
  { href: '/admin/store-assets', label: '스토어 스크린샷' },
```

최종 배열은 다음과 같아야 한다:

```ts
const primaryNavItems = [
  { href: '/admin', label: '대시보드' },
  { href: '/admin/flowers', label: '꽃 관리' },
  { href: '/admin/spots', label: '명소 관리' },
  { href: '/admin/stays', label: '호텔 관리' },
  { href: '/admin/spots/import', label: 'JSON 등록' },
  { href: '/admin/suggestions', label: '추천 접수' },
  { href: '/admin/notifications', label: '알림 발송' },
  { href: '/admin/store-assets', label: '스토어 스크린샷' },
  { href: '/admin/settings', label: '설정' },
];
```

- [ ] **Step 2: 타입체크**

Run: `pnpm --filter flower-map-web exec tsc --noEmit`
Expected: 통과.

- [ ] **Step 3: 커밋**

```bash
git add apps/web/src/features/dashboard/AdminSidebar.tsx
git commit -m "feat(web): 어드민 사이드바에 스토어 스크린샷 메뉴 추가"
```

---

## Chunk 6: 통합 검증

### Task 14: 빌드 및 테스트 전체 통과

- [ ] **Step 1: 전체 테스트 실행**

Run: `pnpm --filter flower-map-web test`
Expected: 전부 PASS (기존 테스트 회귀 없고, 신규 panels/PanelCanvas 테스트 통과).

- [ ] **Step 2: Next.js 빌드**

Run: `pnpm --filter flower-map-web build`
Expected: 성공. `apps/web/.next/` 생성. 빌드 출력 표에서:
- `/admin/store-assets` 라우트가 포함되어 있는지 확인
- 해당 라우트의 First Load JS가 다른 admin 라우트와 비슷한 수준인지 확인 (html-to-image/jszip이 메인 번들로 끌려가지 않았다는 신호). 만약 +200KB 이상으로 비대해졌다면 핸들러 내 `await import(...)` lazy 로드가 제대로 작동하지 않은 것이므로 점검 필요.

- [ ] **Step 3: 린트**

Run: `pnpm --filter flower-map-web lint`
Expected: 통과 (또는 기존 코드와 동일한 경고 수준).

---

### Task 15: 수동 검증 (사용자가 직접 실행)

- [ ] **Step 1: 개발 서버 기동**

Run: `pnpm --filter flower-map-web dev`

- [ ] **Step 2: 시나리오 검증**

브라우저에서 `http://localhost:3000/admin/store-assets` 접속(admin 계정 로그인 필요).

확인 항목:
1. 사이드바에 "스토어 스크린샷" 메뉴가 보인다.
2. 7개 패널 카드가 그리드로 표시된다. 1번 카드에 "NEW" 배지가 있다.
3. iOS/Android 토글로 미리보기 사이즈가 바뀐다.
4. 카드 하나에 임의의 PNG를 업로드하면 폰 안에 표시된다.
5. "PNG 다운로드"를 누르면 `ios-1-hotel.png` 같은 파일이 받아지고, 열어보면 1242×2688 사이즈이며 헤드라인/서브헤드/폰 안의 업로드 이미지가 모두 보인다.
6. "전체 ZIP 다운로드"를 누르면 `store-assets-YYYYMMDD.zip`이 받아지고, 풀면 `ios/` `android/` 폴더에 각 7장씩 들어있다.
7. 업로드 안 한 패널도 빈 폰 placeholder 상태로 PNG가 정상 생성된다.

- [ ] **Step 3: 회귀 점검**

다른 어드민 페이지(`/admin/flowers`, `/admin/spots`, `/admin/stays`)가 변경 없이 정상 동작하는지 클릭으로 확인.

---

## 완료 보고 (체크리스트)

전 태스크 완료 후, 지시자에게 다음을 보고:

- 추가/수정된 파일 목록
- 신규 의존성 (html-to-image, jszip, file-saver, @types/file-saver) 버전
- `pnpm test` / `pnpm build` 결과
- 수동 검증 결과 (수기 캡처 또는 실제 다운로드 파일 픽셀 확인 결과)
- 미해결 이슈가 있다면 명시
