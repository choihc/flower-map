# 앱스토어 스크린샷 생성기 (Admin) 설계 문서

작성일: 2026-05-20
대상: `apps/web` 어드민 / 신규 페이지 `/admin/store-assets`

## 1. 배경 / 목적

앱스토어·플레이스토어 등록·갱신 시 사용할 마케팅 스크린샷(폰 목업 + 카피 + 배경)을 어드민에서 즉시 생성·다운로드한다. 이번 릴리즈에는 **명소 ↔ 호텔 연결** 기능이 새로 추가되었고, 이를 가장 앞에 노출해야 한다. 홈 화면도 함께 개편되어 기존 스크린샷은 전면 재촬영이 필요하다.

기존 등록물(첨부 참고 이미지)은 외주/디자이너 협업으로 만들어졌으나, 이번 릴리즈 시점에는 어드민에서 셀프 서비스로 빠르게 만들고자 한다.

## 2. 비목표(Non-goals)

- 모든 릴리즈에서 재사용 가능한 범용 에디터가 아니다. **이번 릴리즈용 고정 템플릿**. 다음 릴리즈에서 문구·구성이 바뀌면 코드를 수정한다.
- 디자이너 수준의 자유 편집(드래그·자르기·필터 등)은 제공하지 않는다.
- 등록물의 자동 업로드/배포(App Store Connect API, Play Console API 연동 등)는 포함하지 않는다. 어드민은 PNG 파일만 생산한다.

## 3. 사용 시나리오

1. 어드민이 디바이스(iOS 시뮬레이터 또는 실기기)에서 7개 화면 스크린샷을 PNG로 저장한다.
2. `/admin/store-assets` 페이지에 접속한다.
3. 좌측 7개 패널 카드에 각각 자기 화면 스크린샷을 업로드한다(드래그&드롭 또는 파일 선택).
4. 우측 상단에서 플랫폼(iOS 6.5″ / Android)을 토글하며 미리보기 확인.
5. 패널별 "PNG 다운로드" 버튼 또는 우측 상단 "전체 ZIP 다운로드"로 결과물 수집.
6. App Store Connect / Play Console에 업로드.

업로드된 스크린샷은 **세션 동안만 메모리에 보관**한다(localStorage 저장 X — 용량 이슈, 일회성 작업이라는 성격).

## 4. 패널 구성 (확정 7장)

| 순서 | 슬러그 | 헤드라인 | 서브헤드 | 폰 내부 화면(권장) | 배경 톤 |
|---|---|---|---|---|---|
| 1 | `hotel` | 명소와 한번에 호텔까지 (NEW) | 꽃 명소 주변 숙소를 바로 예약 | 명소 상세 하단 호텔 섹션 | 라일락 핑크(NEW 강조) |
| 2 | `detail` | 명소 상세를 풍부하게 | 영상과 블로그 글을 함께 확인 | 명소 상세 + 콘텐츠 | 연한 봄 핑크 |
| 3 | `home` | 오늘, 꽃 보러 갈까? | 지금 피는 꽃을 한 눈에 | 새 홈화면 | 진한 벚꽃 핑크 |
| 4 | `bloom` | 실시간 개화정보 | 전국 명소 개화율을 한 화면에 | 개화 현황 화면 | 살구 톤 |
| 5 | `nearby` | 주변 꽃 명소 추천 | 현재 위치 기반 명소 지도 | 지도/탐색 화면 | 민트 |
| 6 | `direction` | 길찾기까지 한번에 | 지금 바로 찾아가는 꽃 나들이 | 길찾기/지도 | 라벤더 |
| 7 | `saved` | 나만의 꽃 명소 | 다시 찾고 싶은 장소 쉽게 저장 | 저장 목록 | 베이지 |

이 메타데이터는 `panels.ts`에 `PanelConfig[]` 형태로 그대로 코딩한다. 슬러그 유니크 보장을 위해 dev 환경에서 모듈 로드 시 `Set` 크기 단언 어설션을 추가한다.

문구·순서는 코드에 하드코딩한다(다음 릴리즈에서 변경되면 코드 수정).

App Store 검색 노출(상위 3장) 우선순위: NEW 호텔 → 콘텐츠 풍부 → 브랜드 훅.

## 5. 출력 사양

| 플랫폼 | 해상도 | 비율 | 파일명 |
|---|---|---|---|
| iOS 6.5″ | 1242 × 2688 | 9:19.5 | `ios-{n}-{slug}.png` |
| Android | 1080 × 1920 | 9:16 | `android-{n}-{slug}.png` |

`{n}`은 1~7, `{slug}`는 §4의 슬러그 컬럼.

**패널별 PNG 다운로드:** 우상단 토글에서 **현재 선택된 플랫폼 1장만** 다운로드한다(즉 1회 클릭 = 1개 PNG). 두 플랫폼 모두 받고 싶으면 토글을 바꿔 다시 누르거나 ZIP을 사용한다.

**ZIP 다운로드:** 두 플랫폼 14장 전체를 하나로 묶는다. 내부 디렉터리 구조:

```
store-assets-{YYYYMMDD}.zip
├── ios/
│   ├── ios-1-hotel.png
│   └── ...
└── android/
    ├── android-1-hotel.png
    └── ...
```

## 6. 시각 디자인

- **레이아웃 (공통):**
  - 패널 배경: 단색 또는 부드러운 그라데이션
  - 상단 1/3: 헤드라인(굵은 한글, Pretendard Bold 또는 프로젝트 기본 폰트) + 서브헤드(라이트 톤)
  - 우상단: 작은 벚꽃 SVG 1~2개(NEW 패널만 톤 강조)
  - 중하단: 폰 목업(검정 라운드 프레임, 다이내믹 아일랜드 포함), **정면·수직**, 화면 중앙 정렬
  - NEW 라벨: 1번 패널 헤드라인 옆에 분홍 배지로 표기
- **폰 프레임 비율:** 양 플랫폼 동일하게 9:19.5(iPhone 비례)로 그린다. Android에서도 일관성을 위해 동일 프레임 사용. 캔버스 배경 크기만 플랫폼별로 다름.
- **타이포 스케일(iOS 1242 기준):**
  - 헤드라인 100~120px / line-height 1.15 / weight 800
  - 서브헤드 48~56px / line-height 1.3 / weight 500 / 색 #6B5B5B
  - NEW 배지 36px / 분홍 #FF7B9C 배경 / 흰색 글자
- **배경 색상:** 패널별 의미에 맞는 파스텔 톤(위 표). 코드에 토큰화.

## 7. 기술 아키텍처

### 7.1 디렉터리

```
apps/web/
├── app/admin/(dashboard)/store-assets/
│   └── page.tsx               # 라우트 진입점
└── src/features/store-assets/
    ├── StoreAssetsPage.tsx    # 메인 컴포넌트 (클라이언트)
    ├── panels.ts              # 7개 패널 메타데이터 (헤드라인/서브/배경/슬러그)
    ├── PanelCanvas.tsx        # 한 패널의 실제 렌더링 (1242×2688 또는 1080×1920)
    ├── PhoneFrame.tsx         # 폰 목업 SVG/CSS 컴포넌트
    ├── PanelCard.tsx          # 좌측 리스트의 카드(미리보기 + 업로드 + 다운로드)
    ├── PlatformToggle.tsx     # iOS/Android 토글
    ├── useExportPanel.ts      # html-to-image PNG 변환 hook
    └── useExportZip.ts        # 전체 ZIP 묶음 hook
```

### 7.2 핵심 컴포넌트 인터페이스

```ts
type Platform = 'ios' | 'android';

type PanelConfig = {
  index: number;            // 1~7
  slug: string;             // 'hotel', 'detail', ...
  headline: string;
  subhead: string;
  isNew?: boolean;
  background: string;       // CSS color or gradient
  flowerAccent?: 'sakura' | 'lilac' | 'none';
};

type PanelCanvasProps = {
  panel: PanelConfig;
  platform: Platform;
  screenshotDataUrl: string | null;  // null이면 빈 폰 프레임 표시
};

// 디자인 사이즈는 항상 실제 출력 픽셀로 렌더. 미리보기는 transform: scale로 축소.
const DESIGN_SIZE = {
  ios:     { width: 1242, height: 2688 },
  android: { width: 1080, height: 1920 },
};
```

### 7.3 렌더링 & 다운로드

- **렌더 노드 분리:** 미리보기와 PNG 추출은 같은 DOM 노드를 공유하지 않는다.
  - **추출용 노드:** `PanelCanvas`를 실제 출력 픽셀(예: 1242×2688) 그대로 `<div>`로 렌더링하되, 화면 밖(`position: fixed; left: -99999px; top: 0;` 또는 `transform`이 걸리지 않은 오프스크린 컨테이너)에 둔다. `html-to-image.toPng`는 이 노드를 그대로 캡처한다.
  - **미리보기 노드:** 같은 `PanelCanvas` 트리를 한 번 더 마운트하되 `transform: scale(0.18)` 등 축소 변환을 적용한다. 시각 확인 전용.
  - 이중 마운트의 메모리 비용은 React가 동일 컴포넌트를 두 인스턴스로 들고 있는 정도(업로드 이미지 dataURL은 prop으로 공유)라 미미하다.
- **PNG 추출:** `html-to-image` 의 `toPng(extractionNode, { pixelRatio: 1, width, height })`.
  - 추출 전 사전 조건: (1) `await document.fonts.ready` 로 웹폰트 로딩 보장, (2) 폰 내부 `<img>` 요소가 있으면 `await img.decode()` 또는 `onload` 대기로 디코드 완료 보장. 두 조건을 충족한 뒤에만 캡처 호출.
- **ZIP 묶음:** `jszip` 으로 14장(iOS 7 + Android 7) blob 추가 → §5의 디렉터리 구조대로 폴더 분리 → `file-saver`의 `saveAs`.
- **업로드 처리:** `FileReader.readAsDataURL`로 dataURL 변환 후 React state(`Record<slug, dataURL>`)에 보관(메모리). 새로고침 시 사라진다.

### 7.4 신규 의존성

- `html-to-image` (~30KB)
- `jszip` (~100KB)
- `file-saver` (~5KB)

세 라이브러리 모두 `apps/web/package.json` dependencies에 추가.

**번들 영향 최소화:**
- 페이지 컴포넌트 자체는 `next/dynamic(..., { ssr: false })`로 admin 라우트에서만 로드 (서버 렌더 불필요).
- `html-to-image` / `jszip` / `file-saver` 모듈은 React 컴포넌트가 아니므로 `next/dynamic` 대상이 아니다. 이들은 각 버튼 핸들러 내부에서 `const { toPng } = await import('html-to-image')` 형태로 lazy load 한다.

### 7.5 상태 관리

페이지 단일 컴포넌트 내부에서 `useState`로 충분:

```ts
const [platform, setPlatform] = useState<Platform>('ios');
const [screenshots, setScreenshots] = useState<Record<string, string>>({});
// key: panel.slug → value: dataURL
```

전역 상태 도구 불필요(zustand/redux 없음).

## 8. 페이지 레이아웃 (와이어프레임)

```
┌──────────────────────────────────────────────────────────────┐
│  스토어 스크린샷                  [iOS 6.5″ | Android] [ZIP↓]│
├──────────────────────────────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌────┐ │
│ │ 1    │ │ 2    │ │ 3    │ │ 4    │ │ 5    │ │ 6    │ │ 7  │ │
│ │ NEW  │ │ 상세 │ │ 훅   │ │ 개화 │ │ 주변 │ │ 길찾 │ │ 저장│ │
│ │ 프리뷰│ │ ...  │ │      │ │      │ │      │ │      │ │    │ │
│ │ [업로드]                                                │ │ │
│ │ [PNG↓]                                                  │ │ │
│ └──────┘ └──────┘ ...                                        │
└──────────────────────────────────────────────────────────────┘
```

7개 카드는 가로 스크롤 또는 grid-2/3-column으로 배치(반응형). 데스크톱 기준 3열 그리드 권장.

## 9. 어드민 사이드바 등록

`apps/web/app/admin/(dashboard)/layout.tsx`(또는 사이드바 정의 파일)에 메뉴 추가:

```
대시보드
- 꽃
- 명소
- 호텔
- 알림
- 설정
- 스토어 스크린샷  ← 신규
```

권한은 기존 admin guard 그대로 적용.

## 10. 엣지 케이스 / 상태

- **업로드 안 된 패널:** 폰 프레임 안에 placeholder("스크린샷 업로드") 표시. PNG 다운로드는 가능(빈 폰 상태) — 의도된 동작.
- **잘못된 이미지 포맷:** `image/*` accept로 1차 차단. FileReader 에러 시 toast 노출.
- **매우 큰 파일(>10MB):** 경고 토스트 후 그대로 사용. 압축은 하지 않는다(렌더링 사이즈가 작아 메모리/성능 무관).
- **ZIP 생성 중:** 버튼 disabled + 진행률 인디케이터.
- **모바일 브라우저 접근:** 데스크톱 권장 안내 배너(생성 후 결과물 다운로드만이라도 가능).
- **폰트 미로딩 상태에서 캡처:** `document.fonts.ready`를 await하지 않으면 헤드라인이 시스템 폰트로 캡처될 수 있음. §7.3의 사전 조건에서 처리.
- **이미지 디코드 미완료 캡처:** 업로드 직후 즉시 다운로드를 누르면 `<img>`가 디코드 완료 전일 수 있음. §7.3의 `img.decode()` 대기로 처리.

## 11. 테스트 전략

본 페이지는 시각적 결과물이 본질이고 외부 라이브러리(html-to-image, jszip)에 강하게 의존하므로 **유닛 테스트는 최소화**한다.

- 단위 테스트(권장): `panels.ts` 메타데이터가 7개 패널을 빠짐없이 가지고 슬러그가 유니크한지.
- 컴포넌트 스모크 테스트(권장): `PanelCanvas`가 iOS/Android prop에 따라 다른 width/height를 가진 DOM을 렌더하는지.
- E2E/시각 회귀 테스트: 도입하지 않음(투자 대비 효용 낮음).
- 수동 검증: 7개 패널 × 2 플랫폼 = 14장 PNG 다운로드해 실제 픽셀 사이즈 확인(미리보기는 신뢰 X).

## 12. 작업 범위 / 변경 영향

신규 추가:
- `apps/web/app/admin/(dashboard)/store-assets/page.tsx`
- `apps/web/src/features/store-assets/*`
- `apps/web/package.json` (의존성 3개)

수정:
- `apps/web/app/admin/(dashboard)/layout.tsx` 사이드바 메뉴 (또는 그에 해당하는 nav 정의 파일)

영향 없음:
- `apps/mobile/`, `apps/toss-mini/`, 공유 패키지(`packages/*`), 데이터베이스 스키마, API 라우트, 백엔드 어디에도 영향 없음. **순수 프런트 어드민 작업**.

## 13. 향후 고려(이번 릴리즈 범위 외)

- 다국어(영어) 버전 스크린샷 생성: 패널 메타데이터에 locale을 추가하면 확장 가능.
- iPad용 사이즈(2064×2752): App Store iPad 카테고리 노출 필요 시 별도 작업.
- 디자인 토큰 외부화: 다음 릴리즈에 자주 갱신될 가능성이 보이면 패널 메타데이터를 별도 JSON으로 분리 검토.
