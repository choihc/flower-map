export type Platform = 'ios' | 'android';

export const DESIGN_SIZE: Record<Platform, { width: number; height: number }> = {
  ios: { width: 1242, height: 2688 },
  android: { width: 1080, height: 1920 },
};

export const PLATFORM_LABEL: Record<Platform, string> = {
  ios: 'iOS 6.5″',
  android: 'Android',
};

/**
 * 디자인 핸드오프 베이스 사이즈. 모든 픽셀 값은 이 기준으로 디자인됐고,
 * 실제 캔버스 크기는 width / DESIGN_BASE_W 만큼 스케일된다.
 * (308 × 668 ≈ App Store 1290 × 2796 비율 1:2.169)
 */
export const DESIGN_BASE_W = 308;

/** 폰 비율(디자인 200×420 = 1:2.1, iPhone 19.5:9 ≈ 1:2.167과 거의 동일). */
export const PHONE_FRAME = {
  aspect: 420 / 200,
  /** 캔버스 폭 대비 폰 폭 (디자인 200/308) */
  widthRatio: 200 / DESIGN_BASE_W,
  /** 폰을 캔버스 하단에서 아래로 밀어내는 양. -60(@scale=1) ≈ 캔버스의 54%가 폰 영역으로 노출 */
  bottomOffsetBase: -60,
  /** 폰 회전각(반시계, 도) */
  tiltDeg: -6,
};

/** 디자인 팔레트 6종. from/to=배경 그라데이션, ink=텍스트, accent=NEW배지/포인트, soft=폰 내부 화면 배경 */
export const PALETTES = {
  lilac: { from: '#EADCFF', to: '#C9B3F2', ink: '#2E1A52', accent: '#7B3FE4', soft: '#F5EBFF' },
  blossom: { from: '#FFE0EC', to: '#FFB9D2', ink: '#5A1B36', accent: '#E03B7F', soft: '#FFF0F6' },
  peach: { from: '#FFE2D1', to: '#FFB89B', ink: '#5A2310', accent: '#E55A2B', soft: '#FFF1E8' },
  amber: { from: '#FFE2B8', to: '#FFC078', ink: '#553200', accent: '#C97A11', soft: '#FFF1D6' },
  fern: { from: '#D7F2C8', to: '#9EE08A', ink: '#1F3D17', accent: '#3F8C2B', soft: '#EBF8E2' },
  iris: { from: '#DDD3FB', to: '#B4A4F0', ink: '#241750', accent: '#6442D6', soft: '#ECE6FE' },
} as const;
export type PaletteKey = keyof typeof PALETTES;

/** 사쿠라 꽃잎의 단일 톤. 모든 팔레트 공통으로 부드러운 블라썸 핑크. */
export const PETAL_TINT = '#FFB7C8';

const SANS_FONT =
  "'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', system-ui, sans-serif";
const SERIF_FONT = "'Nanum Myeongjo', 'Pretendard', serif";
const MONO_FONT = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

export const FONT = {
  sans: SANS_FONT,
  serif: SERIF_FONT,
  mono: MONO_FONT,
};

/**
 * 디자인 베이스(308 폭) 기준의 픽셀 값. 캔버스에서는 모두 × scale.
 * scale = canvasWidth / DESIGN_BASE_W
 */
export const TYPO_BASE = {
  edgePadding: 28,
  /** NEW 배지 */
  newBadgePadX: 12,
  newBadgePadY: 5,
  newBadgePx: 11,
  /** 페이지 번호(우상단) */
  pageNumberPx: 11,
  pageNumberOpacity: 0.5,
  /** 헤드라인 */
  headlinePx: 38,
  headlineLineHeight: 1.12,
  headlineWeight: 800,
  headlineLetterSpacing: '-0.02em',
  headlineTopWithBadge: 72,
  headlineTopWithoutBadge: 60,
  /** 서브헤드 */
  subheadPx: 13,
  subheadLineHeight: 1.45,
  subheadMarginTop: 14,
  subheadOpacity: 0.7,
};
