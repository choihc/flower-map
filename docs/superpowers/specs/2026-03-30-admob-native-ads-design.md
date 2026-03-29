# AdMob 네이티브 광고 연동 설계

**날짜:** 2026-03-30
**앱:** 꽃 어디 (kkoteodi)
**목적:** react-native-google-mobile-ads를 사용하여 스팟 목록과 스팟 상세 페이지에 네이티브 광고를 삽입, 수익 창출

---

## 1. 목표

- 스팟 목록(SpotListScreen)에서 5번째 항목 뒤에 네이티브 광고 1개 삽입
- 스팟 상세(SpotDetailScreen)에서 방문정보 SectionCard와 소개 SectionCard 사이에 네이티브 광고 삽입
- 앱의 기존 UI 스타일과 조화를 이루는 네이티브 광고 카드 컴포넌트 구현
- 개발 중에는 Google 테스트 광고 ID 사용, 프로덕션에서는 실제 AdMob 유닛 ID 사용

---

## 2. 전체 아키텍처

```
[react-native-google-mobile-ads 설치]
       ↓
[app.config.ts] AdMob 플러그인 + iOS/Android App ID 설정 (process.env 사용)
       ↓
[NativeSpotAd 컴포넌트]
  - 앱 디자인에 맞는 네이티브 광고 카드
  - 로딩 중: 스켈레톤 표시
  - 로드 실패: 컴포넌트 숨김 (레이아웃 공백 없음)
       ↓
[SpotDetailScreen] — 방문정보 ↔ 소개 SectionCard 사이
[SpotListScreen]   — 5번째 항목 뒤에 광고 1개 (SectionCard 분리)
```

---

## 3. 라이브러리

| 항목 | 내용 |
|------|------|
| 패키지 | `react-native-google-mobile-ads` |
| 버전 | v16.x (Native Ad 지원 v14+, New Architecture 완전 지원) |
| 광고 형식 | Native Advanced |
| Expo 호환 | EAS Build 필요 (이미 설정됨) |
| 최소 지원 | Expo SDK ~55 |

---

## 4. 환경 변수

| 변수명 | 위치 | 필수 여부 | 설명 |
|--------|------|-----------|------|
| `EXPO_PUBLIC_ADMOB_IOS_APP_ID` | `.env` | 필수 | AdMob iOS 앱 ID (`ca-app-pub-xxx~xxx`) |
| `EXPO_PUBLIC_ADMOB_ANDROID_APP_ID` | `.env` | 필수 | AdMob Android 앱 ID |
| `EXPO_PUBLIC_ADMOB_NATIVE_AD_UNIT_ID_IOS` | `.env` | 필수 | iOS 네이티브 광고 유닛 ID |
| `EXPO_PUBLIC_ADMOB_NATIVE_AD_UNIT_ID_ANDROID` | `.env` | 필수 | Android 네이티브 광고 유닛 ID |

**개발용 테스트 ID (Google 공식):**
- App ID (iOS): `ca-app-pub-3940256099942544~1458002511`
- App ID (Android): `ca-app-pub-3940256099942544~3347511713`
- Native Ad Unit ID (iOS): `ca-app-pub-3940256099942544/3986624511`
- Native Ad Unit ID (Android): `ca-app-pub-3940256099942544/2247696110`

---

## 5. app.config.ts 전환 및 플러그인 설정

현재 `app.json`을 `app.config.ts`로 전환하여 환경변수(`process.env`)를 사용할 수 있게 합니다.

`app.json` → `app.config.ts`로 파일명 변경 후 아래 형식으로 변환:

```ts
import type { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  // ... 기존 app.json 필드들 ...
  plugins: [
    // ... 기존 플러그인들 ...
    [
      'react-native-google-mobile-ads',
      {
        android_app_id: process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID ?? '',
        ios_app_id: process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID ?? '',
      },
    ],
  ],
});
```

> `ios_app_id` 값은 `Info.plist`의 `GADApplicationIdentifier` 키에 자동 주입됩니다.

---

## 6. 파일 구조

### 신규 파일
| 파일 | 역할 |
|------|------|
| `apps/mobile/src/shared/ui/NativeSpotAd.tsx` | 네이티브 광고 카드 컴포넌트 |
| `apps/mobile/src/shared/lib/adConfig.ts` | 광고 유닛 ID 및 설정 관리 |

### 수정 파일
| 파일 | 변경 내용 |
|------|----------|
| `apps/mobile/app.json` → `apps/mobile/app.config.ts` | app.json을 app.config.ts로 전환, react-native-google-mobile-ads 플러그인 추가 |
| `apps/mobile/src/features/spot/screens/SpotDetailScreen.tsx` | 방문정보↔소개 사이 NativeSpotAd 삽입 |
| `apps/mobile/src/features/map/screens/SpotListScreen.tsx` | 5번째 항목 뒤에 NativeSpotAd 1개 삽입 |

---

## 7. NativeSpotAd 컴포넌트 (`NativeSpotAd.tsx`)

### UI 구조
```
┌─────────────────────────────────┐
│ [Ad 뱃지]                       │
│                                 │
│ [MediaView - 광고 이미지/영상]   │
│                                 │
│ 광고 제목 (HeadlineView)         │
│ 광고 설명 (BodyView)             │
│                                 │
│ [아이콘] 광고주명    [CTA 버튼]  │
└─────────────────────────────────┘
```

### 동작
- `NativeAd`는 클래스. `await NativeAd.createForAdRequest(adUnitId)` 정적 팩토리 메서드로 로드
- `NativeAdView`에 로드된 인스턴스를 `nativeAd` prop으로 전달
- 자식 요소는 `NativeAsset`으로 `assetType` 지정, 미디어는 `NativeMediaView` 사용:

  ```tsx
  const nativeAd = await NativeAd.createForAdRequest(adUnitId);

  <NativeAdView nativeAd={nativeAd}>
    <NativeAsset assetType={NativeAssetType.HEADLINE}>
      <Text>{nativeAd.headline}</Text>
    </NativeAsset>
    <NativeAsset assetType={NativeAssetType.BODY}>
      <Text>{nativeAd.body}</Text>
    </NativeAsset>
    <NativeMediaView />
    <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
      <Text>{nativeAd.callToAction}</Text>
    </NativeAsset>
  </NativeAdView>
  ```
- 오류 처리: `createForAdRequest` 호출을 `try/catch`로 감싸고, 실패 시 `null` 반환
- 이벤트 감지: `nativeAd.addAdEventListener()` 사용 (필요 시)
- 로딩 중: `SkeletonBox`로 동일 높이 플레이스홀더 표시
- 로드 실패: `null` 반환 (레이아웃 공백 없음)
- 언마운트 시: `nativeAd.destroy()` 호출로 네이티브 리소스 해제 (필수)
- 스타일: 기존 `SectionCard`와 동일한 border-radius, shadow, padding 적용

---

## 8. 광고 삽입 위치 상세

### SpotDetailScreen

현재 섹션 순서:
1. SpotHeroCard
2. SpotPhotoGallery
3. LikeButton
4. MetaRow (축제 일정, 입장료)
5. SectionCard "방문 정보" ← 여기 아래
6. **[NativeSpotAd]** ← 광고 삽입
7. SectionCard "소개"
8. SectionCard "운영 팁"
9. SectionCard "비슷한 꽃 명소"

### SpotListScreen

현재 SpotListScreen의 `.map()`은 `<SectionCard>` 컴포넌트 내부에서 렌더링됩니다(`SpotListScreen.tsx:82-95`). `SectionCard` 내부에 광고를 삽입하면 카드의 padding/border 안에 갇혀 UI가 어색해지므로, `visibleSpots`를 두 구간으로 나누어 두 개의 `SectionCard` 사이에 광고를 삽입합니다.

```
<SectionCard title={sectionTitle}>
  항목 0
  항목 1
  항목 2
  항목 3
  항목 4
</SectionCard>

[NativeSpotAd] ← SectionCard와 SectionCard 사이 (SectionCard 외부)

<SectionCard title="">
  항목 5
  항목 6
  ...
</SectionCard>
```

구현 방식:
- `visibleSpots.slice(0, 5)`를 첫 번째 `SectionCard`에 렌더링
- `visibleSpots.slice(5)`를 두 번째 `SectionCard`에 렌더링 (두 번째가 비어있으면 렌더링 안 함)
- 두 SectionCard 사이에 `<NativeSpotAd />` 삽입
- 항목이 5개 미만(length < 5)이면 단일 SectionCard만 렌더링하고 광고 미표시
- 두 번째 `SectionCard`는 `title` prop을 전달하지 않거나 조건부 렌더링 처리 필요 (`SectionCard`가 `title`이 빈 문자열이면 `<Text>` 요소를 렌더링하지 않도록 수정)

---

## 9. 범위 외 (Out of Scope)

- 배너 광고, 전면 광고, 보상형 광고
- 홈 화면 광고
- 광고 클릭 이벤트 커스텀 트래킹
- 광고 A/B 테스트
- 광고 빈도 제한 (frequency capping)
