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
  // 폰 내부 스크린샷이 다이내믹 아일랜드 아래에서 시작하도록 두는 상단 안전 영역. width 기준 비율.
  safeAreaTopRatio: 0.13,
};

/** 플랫폼별 폰 배치 계수. 캔버스 폭 대비 폰 폭(widthRatio)과 캔버스 세로 대비 하단 잘림 비율(bottomCutRatio)을 분기한다. */
export const PHONE_LAYOUT: Record<Platform, { widthRatio: number; bottomCutRatio: number }> = {
  // iOS(1242×2688): 폰 932×2019, 폰 상단 ≈ 885px, 헤드라인 영역 ≈ 470px → 안전 여백 ≈ 415px
  ios: { widthRatio: 0.75, bottomCutRatio: 0.08 },
  // Android(1080×1920): 폰 670×1451, 폰 상단 ≈ 622px, 헤드라인 영역 ≈ 402px → 안전 여백 ≈ 220px
  android: { widthRatio: 0.62, bottomCutRatio: 0.08 },
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
