# AdMob 네이티브 광고 연동 구현 계획

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** react-native-google-mobile-ads v16을 사용하여 SpotListScreen(5번째 항목 뒤)과 SpotDetailScreen(방문정보↔소개 사이)에 네이티브 광고 카드를 삽입한다.

**Architecture:** NativeAd.createForAdRequest()로 광고를 비동기 로드하고 NativeAdView + NativeAsset으로 렌더링하는 NativeSpotAd 컴포넌트를 구현한다. SpotListScreen은 visibleSpots를 slice(0,5) / slice(5)로 나눠 두 SectionCard 사이에 광고를 삽입한다. SpotDetailScreen은 방문정보 SectionCard 바로 아래에 광고를 삽입한다.

**Tech Stack:** react-native-google-mobile-ads v16.x, Expo SDK 55, EAS Build, TypeScript, vitest

---

## 파일 구조

### 신규 생성
| 파일 | 역할 |
|------|------|
| `apps/mobile/app.config.ts` | app.json 대체 — process.env로 AdMob App ID 주입 |
| `apps/mobile/src/shared/lib/adConfig.ts` | 플랫폼별 광고 유닛 ID 반환 |
| `apps/mobile/src/shared/lib/adConfig.test.ts` | adConfig 유닛 테스트 |
| `apps/mobile/src/shared/ui/NativeSpotAd.tsx` | 네이티브 광고 카드 컴포넌트 |
| `apps/mobile/src/__mocks__/react-native-google-mobile-ads.ts` | vitest용 라이브러리 mock |

### 수정
| 파일 | 변경 내용 |
|------|----------|
| `apps/mobile/app.json` | 삭제 (app.config.ts로 대체) |
| `apps/mobile/vitest.config.ts` | react-native-google-mobile-ads alias 추가 |
| `apps/mobile/src/shared/ui/SectionCard.tsx` | title prop을 optional로 변경 |
| `apps/mobile/src/features/spot/screens/SpotDetailScreen.tsx` | 방문정보↔소개 사이 NativeSpotAd 삽입 |
| `apps/mobile/src/features/map/screens/SpotListScreen.tsx` | SectionCard 분리 + NativeSpotAd 삽입 |

---

## Chunk 1: 패키지 설치, 설정, adConfig

### Task 1: react-native-google-mobile-ads 설치 및 mock 추가

**Files:**
- Modify: `apps/mobile/package.json` (패키지 추가)
- Create: `apps/mobile/src/__mocks__/react-native-google-mobile-ads.ts`
- Modify: `apps/mobile/vitest.config.ts`

- [ ] **Step 1: 패키지 설치**

```bash
cd apps/mobile && npx expo install react-native-google-mobile-ads
```

Expected: `package.json`에 `react-native-google-mobile-ads` 의존성 추가됨

- [ ] **Step 2: vitest mock 파일 작성**

`apps/mobile/src/__mocks__/react-native-google-mobile-ads.ts` 생성:

```ts
export const NativeAd = {
  createForAdRequest: async (_adUnitId: string) => ({
    headline: '테스트 광고 제목',
    body: '테스트 광고 설명',
    callToAction: '더 알아보기',
    advertiser: '테스트 광고주',
    destroy: () => {},
  }),
};

export const NativeAdView = 'NativeAdView';
export const NativeAsset = 'NativeAsset';
export const NativeMediaView = 'NativeMediaView';
export const NativeAssetType = {
  HEADLINE: 'headline',
  BODY: 'body',
  CALL_TO_ACTION: 'callToAction',
  ADVERTISER: 'advertiser',
  ICON: 'icon',
} as const;
```

- [ ] **Step 3: vitest.config.ts에 alias 추가**

현재 `apps/mobile/vitest.config.ts` 내용:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    alias: {
      'expo-location': new URL('./src/__mocks__/expo-location.ts', import.meta.url).pathname,
      'expo-notifications': new URL('./src/__mocks__/expo-notifications.ts', import.meta.url).pathname,
      'expo-device': new URL('./src/__mocks__/expo-device.ts', import.meta.url).pathname,
    },
  },
});
```

`'react-native-google-mobile-ads'` alias를 추가하여 아래와 같이 수정:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    alias: {
      'expo-location': new URL('./src/__mocks__/expo-location.ts', import.meta.url).pathname,
      'expo-notifications': new URL('./src/__mocks__/expo-notifications.ts', import.meta.url).pathname,
      'expo-device': new URL('./src/__mocks__/expo-device.ts', import.meta.url).pathname,
      'react-native-google-mobile-ads': new URL(
        './src/__mocks__/react-native-google-mobile-ads.ts',
        import.meta.url,
      ).pathname,
    },
  },
});
```

- [ ] **Step 4: 커밋**

```bash
cd apps/mobile && git add src/__mocks__/react-native-google-mobile-ads.ts vitest.config.ts && git commit -m "feat(mobile): react-native-google-mobile-ads 설치 및 vitest mock 추가"
```

---

### Task 2: app.json → app.config.ts 전환

**Files:**
- Create: `apps/mobile/app.config.ts`
- Delete: `apps/mobile/app.json`

- [ ] **Step 1: app.config.ts 생성**

`apps/mobile/app.config.ts` 파일을 아래 내용으로 생성 (기존 app.json 내용을 TypeScript 형식으로 변환 + AdMob 플러그인 추가):

```ts
import type { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: '꽃 어디',
  slug: 'kkoteodi',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/kkoticon.png',
  scheme: 'kkoteodi',
  userInterfaceStyle: 'light',
  ios: {
    supportsTablet: true,
    icon: './assets/images/kkoticon_flat.png',
    bundleIdentifier: 'com.kkoteodi.mobile',
    entitlements: {
      'com.apple.developer.applesignin': ['Default'],
    },
    infoPlist: {
      LSApplicationQueriesSchemes: ['nmap'],
      NSUserNotificationsUsageDescription: '주요 꽃 행사 소식을 알려드리기 위해 알림을 사용합니다.',
    },
  },
  android: {
    package: 'com.kkoteodi.mobile',
    googleServicesFile: './android/app/google-services.json',
    adaptiveIcon: {
      backgroundColor: '#FFF9F3',
      foregroundImage: './assets/images/kkoticon_foreground.png',
      monochromeImage: './assets/images/kkoticon.png',
    },
    predictiveBackGestureEnabled: false,
    permissions: [],
  },
  web: {
    output: 'static',
    favicon: './assets/images/kkoticon.png',
  },
  plugins: [
    'expo-router',
    'expo-apple-authentication',
    [
      'expo-build-properties',
      {
        ios: {
          deploymentTarget: '16.0',
        },
        android: {
          compileSdkVersion: 35,
          targetSdkVersion: 35,
          minSdkVersion: 24,
        },
      },
    ],
    [
      '@mj-studio/react-native-naver-map',
      {
        client_id: 'jbgn2o8h0j',
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/images/kkoticon.png',
        color: '#FFF9F3',
      },
    ],
    [
      'react-native-google-mobile-ads',
      {
        android_app_id: process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID ?? '',
        ios_app_id: process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID ?? '',
      },
    ],
  ],
  privacyPolicyUrl: 'https://kkoteodie.nextvine.app/privacy',
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: 'c4af274d-b7c9-4d43-a479-00e6ae4d1944',
    },
  },
  owner: 'nextvines-organization',
});
```

- [ ] **Step 2: app.json 삭제**

```bash
cd apps/mobile && rm app.json
```

- [ ] **Step 3: Expo 설정이 정상적으로 인식되는지 확인**

```bash
cd apps/mobile && npx expo config --type introspect 2>&1 | head -20
```

Expected: 에러 없이 설정이 출력됨

- [ ] **Step 4: 커밋**

```bash
cd apps/mobile && git add app.config.ts && git rm app.json && git commit -m "feat(mobile): app.json을 app.config.ts로 전환하여 AdMob 플러그인 추가"
```

---

### Task 3: adConfig.ts 구현 (TDD)

**Files:**
- Create: `apps/mobile/src/shared/lib/adConfig.test.ts`
- Create: `apps/mobile/src/shared/lib/adConfig.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`apps/mobile/src/shared/lib/adConfig.test.ts` 생성:

```ts
import { describe, expect, it, afterEach } from 'vitest';

import { getNativeAdUnitId } from './adConfig';

describe('getNativeAdUnitId', () => {
  afterEach(() => {
    delete process.env.EXPO_PUBLIC_ADMOB_NATIVE_AD_UNIT_ID_IOS;
    delete process.env.EXPO_PUBLIC_ADMOB_NATIVE_AD_UNIT_ID_ANDROID;
  });

  it('환경변수 미설정 시 iOS 테스트 광고 유닛 ID를 반환한다', () => {
    expect(getNativeAdUnitId('ios')).toBe('ca-app-pub-3940256099942544/3986624511');
  });

  it('환경변수 미설정 시 Android 테스트 광고 유닛 ID를 반환한다', () => {
    expect(getNativeAdUnitId('android')).toBe('ca-app-pub-3940256099942544/2247696110');
  });

  it('EXPO_PUBLIC_ADMOB_NATIVE_AD_UNIT_ID_IOS 환경변수가 있으면 해당 값을 반환한다', () => {
    process.env.EXPO_PUBLIC_ADMOB_NATIVE_AD_UNIT_ID_IOS = 'ca-app-pub-real/ios-unit';
    expect(getNativeAdUnitId('ios')).toBe('ca-app-pub-real/ios-unit');
  });

  it('EXPO_PUBLIC_ADMOB_NATIVE_AD_UNIT_ID_ANDROID 환경변수가 있으면 해당 값을 반환한다', () => {
    process.env.EXPO_PUBLIC_ADMOB_NATIVE_AD_UNIT_ID_ANDROID = 'ca-app-pub-real/android-unit';
    expect(getNativeAdUnitId('android')).toBe('ca-app-pub-real/android-unit');
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
cd apps/mobile && npx vitest run src/shared/lib/adConfig.test.ts
```

Expected: FAIL — `Cannot find module './adConfig'`

- [ ] **Step 3: adConfig.ts 구현**

`apps/mobile/src/shared/lib/adConfig.ts` 생성:

```ts
export function getNativeAdUnitId(platform: 'ios' | 'android'): string {
  if (platform === 'ios') {
    return (
      process.env.EXPO_PUBLIC_ADMOB_NATIVE_AD_UNIT_ID_IOS ??
      'ca-app-pub-3940256099942544/3986624511'
    );
  }
  return (
    process.env.EXPO_PUBLIC_ADMOB_NATIVE_AD_UNIT_ID_ANDROID ??
    'ca-app-pub-3940256099942544/2247696110'
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
cd apps/mobile && npx vitest run src/shared/lib/adConfig.test.ts
```

Expected: PASS — 4 tests passed

- [ ] **Step 5: 커밋**

```bash
cd apps/mobile && git add src/shared/lib/adConfig.ts src/shared/lib/adConfig.test.ts && git commit -m "feat(mobile): adConfig - 플랫폼별 네이티브 광고 유닛 ID 반환 함수 추가"
```

---

## Chunk 2: UI 컴포넌트 및 화면 통합

### Task 4: SectionCard title 옵셔널 처리

**Files:**
- Modify: `apps/mobile/src/shared/ui/SectionCard.tsx`

현재 `SectionCard`는 `title: string`이 필수입니다. SpotListScreen의 두 번째 SectionCard는 제목 없이 렌더링해야 하므로 optional로 변경합니다.

- [ ] **Step 1: SectionCard.tsx 수정**

`apps/mobile/src/shared/ui/SectionCard.tsx`의 props 타입과 렌더링 로직을 수정:

```tsx
import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

type SectionCardProps = {
  title?: string;
  children?: ReactNode;
};

export function SectionCard({ title, children }: SectionCardProps) {
  return (
    <View style={styles.card}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 22,
    padding: 18,
    shadowColor: '#BDAF9F',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.08,
    shadowRadius: 24,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 12,
  },
});
```

- [ ] **Step 2: 커밋**

```bash
cd apps/mobile && git add src/shared/ui/SectionCard.tsx && git commit -m "feat(mobile): SectionCard title prop을 optional로 변경"
```

---

### Task 5: NativeSpotAd 컴포넌트 구현

**Files:**
- Create: `apps/mobile/src/shared/ui/NativeSpotAd.tsx`

이 컴포넌트는 React Native 네이티브 모듈에 의존하므로 vitest 환경에서 렌더링 테스트는 불가합니다. adConfig 유닛 테스트로 핵심 로직을 검증했으므로, 여기서는 구현 후 EAS Build + 실기기에서 수동 확인합니다.

- [ ] **Step 1: NativeSpotAd.tsx 구현**

`apps/mobile/src/shared/ui/NativeSpotAd.tsx` 생성:

```tsx
import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import {
  NativeAd,
  NativeAdView,
  NativeAsset,
  NativeAssetType,
  NativeMediaView,
} from 'react-native-google-mobile-ads';

import { getNativeAdUnitId } from '../lib/adConfig';
import { colors } from '../theme/colors';
import { SkeletonBox } from './SkeletonBox';

type AdState = 'loading' | 'loaded' | 'failed';

export function NativeSpotAd() {
  const [adState, setAdState] = useState<AdState>('loading');
  const [nativeAd, setNativeAd] = useState<InstanceType<typeof NativeAd> | null>(null);
  const adRef = useRef<InstanceType<typeof NativeAd> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAd() {
      try {
        const platform = Platform.OS as 'ios' | 'android';
        const ad = await NativeAd.createForAdRequest(getNativeAdUnitId(platform));
        if (cancelled) {
          ad.destroy();
          return;
        }
        adRef.current = ad;
        setNativeAd(ad);
        setAdState('loaded');
      } catch {
        if (!cancelled) setAdState('failed');
      }
    }

    loadAd();

    return () => {
      cancelled = true;
      adRef.current?.destroy();
    };
  }, []);

  if (adState === 'failed') return null;

  if (adState === 'loading' || !nativeAd) {
    return <SkeletonBox height={200} borderRadius={24} />;
  }

  return (
    <NativeAdView nativeAd={nativeAd} style={styles.card}>
      <View style={styles.adBadge}>
        <Text style={styles.adBadgeText}>광고</Text>
      </View>

      <NativeMediaView style={styles.media} />

      <NativeAsset assetType={NativeAssetType.HEADLINE}>
        <Text numberOfLines={2} style={styles.headline}>
          {nativeAd.headline}
        </Text>
      </NativeAsset>

      {nativeAd.body ? (
        <NativeAsset assetType={NativeAssetType.BODY}>
          <Text numberOfLines={2} style={styles.body}>
            {nativeAd.body}
          </Text>
        </NativeAsset>
      ) : null}

      <View style={styles.footer}>
        <NativeAsset assetType={NativeAssetType.ADVERTISER}>
          <Text style={styles.advertiser}>{nativeAd.advertiser}</Text>
        </NativeAsset>
        <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
          <View style={styles.ctaButton}>
            <Text style={styles.ctaText}>{nativeAd.callToAction}</Text>
          </View>
        </NativeAsset>
      </View>
    </NativeAdView>
  );
}

const styles = StyleSheet.create({
  adBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.cardAlt,
    borderColor: colors.border,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  adBadgeText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  advertiser: {
    color: colors.textMuted,
    fontSize: 13,
  },
  body: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 22,
    padding: 18,
    shadowColor: '#BDAF9F',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
  },
  ctaButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  headline: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    marginTop: 10,
  },
  media: {
    borderRadius: 16,
    height: 160,
    width: '100%',
  },
});
```

- [ ] **Step 2: 커밋**

```bash
cd apps/mobile && git add src/shared/ui/NativeSpotAd.tsx && git commit -m "feat(mobile): NativeSpotAd 네이티브 광고 카드 컴포넌트 추가"
```

---

### Task 6: SpotDetailScreen 광고 삽입

**Files:**
- Modify: `apps/mobile/src/features/spot/screens/SpotDetailScreen.tsx:88-97`

현재 `SpotDetailScreen.tsx:88-97`의 구조:
```tsx
<SectionCard title="방문 정보">
  ...
</SectionCard>

<SectionCard title="소개">
  ...
</SectionCard>
```

- [ ] **Step 1: NativeSpotAd import 추가 및 광고 삽입**

`apps/mobile/src/features/spot/screens/SpotDetailScreen.tsx`에서:

1. import 목록에 `NativeSpotAd` 추가:
```tsx
import { NativeSpotAd } from '../../../shared/ui/NativeSpotAd';
```

2. "방문 정보" SectionCard와 "소개" SectionCard 사이에 `<NativeSpotAd />` 삽입:
```tsx
      <SectionCard title="방문 정보">
        <DetailRow label="주소" value={spot.location} />
        <DetailRow label="주차" value={spot.parking} />
        <DetailRow label="행사 상태" value={spot.eventEndsIn ? `${spot.eventEndsIn} · 종료 전 방문 추천` : '상시 방문 가능'} />
      </SectionCard>

      <NativeSpotAd />

      <SectionCard title="소개">
        <Text style={styles.bodyText}>{spot.description}</Text>
        <Text style={styles.supportText}>{spot.helper}</Text>
      </SectionCard>
```

- [ ] **Step 2: 커밋**

```bash
cd apps/mobile && git add src/features/spot/screens/SpotDetailScreen.tsx && git commit -m "feat(mobile): SpotDetailScreen 방문정보↔소개 사이에 네이티브 광고 삽입"
```

---

### Task 7: SpotListScreen 광고 삽입

**Files:**
- Modify: `apps/mobile/src/features/map/screens/SpotListScreen.tsx:82-95`

현재 `SpotListScreen.tsx:82-95`의 구조:
```tsx
<SectionCard title={sectionTitle}>
  {visibleSpots.map((spot) => (
    <Pressable key={spot.id} ...>
      ...
    </Pressable>
  ))}
</SectionCard>
```

`visibleSpots`를 두 구간으로 나누고, 5개 이상일 때만 NativeSpotAd를 삽입합니다.

- [ ] **Step 1: NativeSpotAd import 추가**

`apps/mobile/src/features/map/screens/SpotListScreen.tsx` 상단에 import 추가:
```tsx
import { NativeSpotAd } from '../../../shared/ui/NativeSpotAd';
```

- [ ] **Step 2: SectionCard 분리 및 광고 삽입**

기존 단일 SectionCard 렌더링 블록(`lines 82-95`)을 아래로 교체:

```tsx
      <SectionCard title={sectionTitle}>
        {visibleSpots.slice(0, 5).map((spot) => (
          <Pressable key={spot.id} onPress={() => router.push(`/spot/${spot.slug}`)} style={styles.spotRow}>
            <View style={styles.spotContent}>
              <Text style={styles.spotTitle}>{spot.place}</Text>
              <Text style={styles.spotMeta}>
                {spot.flower} · {spot.location}
              </Text>
              <Text style={styles.spotHelper}>{spot.helper}</Text>
            </View>
            <Text style={styles.spotAction}>보기</Text>
          </Pressable>
        ))}
      </SectionCard>

      {visibleSpots.length >= 5 && <NativeSpotAd />}

      {visibleSpots.length > 5 && (
        <SectionCard>
          {visibleSpots.slice(5).map((spot) => (
            <Pressable key={spot.id} onPress={() => router.push(`/spot/${spot.slug}`)} style={styles.spotRow}>
              <View style={styles.spotContent}>
                <Text style={styles.spotTitle}>{spot.place}</Text>
                <Text style={styles.spotMeta}>
                  {spot.flower} · {spot.location}
                </Text>
                <Text style={styles.spotHelper}>{spot.helper}</Text>
              </View>
              <Text style={styles.spotAction}>보기</Text>
            </Pressable>
          ))}
        </SectionCard>
      )}
```

- [ ] **Step 3: 전체 테스트 통과 확인**

```bash
cd apps/mobile && npx vitest run
```

Expected: 모든 기존 테스트 + adConfig 테스트 PASS

- [ ] **Step 4: 커밋**

```bash
cd apps/mobile && git add src/features/map/screens/SpotListScreen.tsx && git commit -m "feat(mobile): SpotListScreen 5번째 항목 뒤에 네이티브 광고 삽입"
```

---

## 환경 변수 설정 안내

EAS Build 시 다음 환경변수를 `.env` 또는 EAS Secrets에 설정해야 합니다:

```env
# 개발 중 (Google 공식 테스트 ID — 기본값으로 내장되어 있어 별도 설정 불필요)
EXPO_PUBLIC_ADMOB_IOS_APP_ID=ca-app-pub-3940256099942544~1458002511
EXPO_PUBLIC_ADMOB_ANDROID_APP_ID=ca-app-pub-3940256099942544~3347511713
EXPO_PUBLIC_ADMOB_NATIVE_AD_UNIT_ID_IOS=ca-app-pub-3940256099942544/3986624511
EXPO_PUBLIC_ADMOB_NATIVE_AD_UNIT_ID_ANDROID=ca-app-pub-3940256099942544/2247696110

# 프로덕션 (AdMob 콘솔에서 발급받은 실제 ID로 교체)
# EXPO_PUBLIC_ADMOB_IOS_APP_ID=ca-app-pub-xxx~xxx
# EXPO_PUBLIC_ADMOB_ANDROID_APP_ID=ca-app-pub-xxx~xxx
# EXPO_PUBLIC_ADMOB_NATIVE_AD_UNIT_ID_IOS=ca-app-pub-xxx/xxx
# EXPO_PUBLIC_ADMOB_NATIVE_AD_UNIT_ID_ANDROID=ca-app-pub-xxx/xxx
```

> **주의:** `EXPO_PUBLIC_ADMOB_IOS_APP_ID`, `EXPO_PUBLIC_ADMOB_ANDROID_APP_ID`는 `app.config.ts` 플러그인 설정에 사용됩니다. EAS Build 시 반드시 설정되어야 하며, 값이 없으면 빈 문자열로 빌드됩니다.

## 실기기 확인 방법

```bash
cd apps/mobile && eas build --profile development:device --platform ios
```

확인 항목:
- SpotListScreen: 스팟이 5개 이상일 때 5번째 항목 아래 광고 카드 표시
- SpotDetailScreen: 방문 정보 카드 아래 광고 카드 표시
- 광고 로드 중: SkeletonBox 표시
- 광고 로드 실패(네트워크 끊김 등): 공백 없이 카드 사라짐
