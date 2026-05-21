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
 * 폰을 캔버스의 **좌하단**에 거의 직립으로 배치. 캔버스 좌측을 살짝 벗어나며 하단이 잘린다.
 * - widthRatio: 캔버스 폭 대비 폰 폭
 * - leftOffsetRatio: 캔버스 좌측 기준 음의 left (-값 = 왼쪽 밖으로 밀림)
 * - bottomOffsetRatio: 캔버스 하단 기준 음의 bottom (-값 = 아래로 밀림)
 * - tiltDeg: 시계방향 회전(양수). 거의 0에 가까움.
 */
export const PHONE_LAYOUT: Record<
  Platform,
  { widthRatio: number; leftOffsetRatio: number; bottomOffsetRatio: number; tiltDeg: number }
> = {
  ios: { widthRatio: 0.5, leftOffsetRatio: 0.04, bottomOffsetRatio: 0.05, tiltDeg: 0 },
  android: { widthRatio: 0.42, leftOffsetRatio: 0.04, bottomOffsetRatio: 0.05, tiltDeg: 0 },
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
  footerPx: 22,
  footerColor: 'rgba(58,39,48,0.55)',
  footerTracking: '0.18em',
};
