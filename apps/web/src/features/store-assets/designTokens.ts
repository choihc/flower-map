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
