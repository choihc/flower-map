export type Platform = 'ios' | 'android';

export const DESIGN_SIZE: Record<Platform, { width: number; height: number }> = {
  ios: { width: 1242, height: 2688 },
  android: { width: 1080, height: 1920 },
};

export const PLATFORM_LABEL: Record<Platform, string> = {
  ios: 'iOS 6.5″',
  android: 'Android',
};

/** 폰 프레임: 9:19.5 비율 + 다이내믹 아일랜드. 레퍼런스 디자인 따름. */
export const PHONE_FRAME = {
  aspect: 19.5 / 9,
  cornerRadiusRatio: 0.085,
  bezelRatio: 0.014,
  islandWidthRatio: 0.32,
  islandHeightRatio: 0.085,
  islandTopRatio: 0.035,
};

/**
 * 폰을 캔버스의 **좌하단(중앙 가까이)**에 직립으로 크게 배치. 폰의 약 40-45%가 캔버스 하단을 넘어 잘린다.
 * - widthRatio: 캔버스 폭 대비 폰 폭 (~78%)
 * - leftInsetRatio: 캔버스 좌측 안쪽으로 들여쓴 거리(양의 left)
 * - bottomOverflowRatio: 캔버스 하단 밖으로 밀려나간 비율(폰 height 기준 잘림 분량을 캔버스 height 비율로)
 * - tiltDeg: 회전각. 0이 기본.
 */
export const PHONE_LAYOUT: Record<
  Platform,
  { widthRatio: number; leftInsetRatio: number; bottomOverflowRatio: number; tiltDeg: number }
> = {
  ios: { widthRatio: 0.78, leftInsetRatio: 0.08, bottomOverflowRatio: 0.34, tiltDeg: 0 },
  android: { widthRatio: 0.66, leftInsetRatio: 0.07, bottomOverflowRatio: 0.32, tiltDeg: 0 },
};

const HEADLINE_FONT =
  '"Gowun Batang", "Nanum Myeongjo", "AppleGothic", "Apple SD Gothic Neo", serif';
const SANS_FONT =
  'Pretendard, "Pretendard Variable", -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", system-ui, sans-serif';
const MONO_FONT = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

export const FONT = {
  headline: HEADLINE_FONT,
  sans: SANS_FONT,
  mono: MONO_FONT,
};

export const TYPO = {
  /** 헤드라인: 굵은 명조체 */
  headlinePx: 132,
  headlineLineHeight: 1.18,
  headlineWeight: 700,
  headlineColor: '#3a2730',
  headlineLetterSpacing: '-0.02em',
  /** 서브헤드: 산세리프 한글 */
  subheadPx: 42,
  subheadLineHeight: 1.4,
  subheadWeight: 500,
  subheadColor: '#5a3f4a',
  /** NEW 배지: 보라 */
  newBadgePx: 38,
  newBadgePadX: 0.03,
  newBadgePadY: 0.014,
  newBadgeBg: '#6B5BD2',
  newBadgeFg: '#FFFFFF',
  newBadgeRadius: 0.022,
  newBadgeTracking: '0.08em',
  /** 페이지 번호(우상단) — 모노 */
  pageNumberPx: 28,
  pageNumberColor: 'rgba(58,39,48,0.7)',
  pageNumberTracking: '0.18em',
  /** 푸터(좌하단) — 모노 */
  footerPx: 26,
  footerColor: 'rgba(58,39,48,0.68)',
  footerTracking: '0.16em',
};
