export type MarkerTier = 'small' | 'medium' | 'large';

export type MarkerStyle = {
  tier: MarkerTier;
  width: number;
  height: number;
  /** @mj-studio/react-native-naver-map의 이미지 심볼 컬러 키 */
  symbol: 'green' | 'pink' | 'red';
};

// SSOT: apps/web/src/lib/now-score/weights.ts · BADGE_THRESHOLDS — 변경 시 웹/모바일 동기화 필요
const TIER_STYLES: Record<MarkerTier, Omit<MarkerStyle, 'tier'>> = {
  small: { width: 24, height: 28, symbol: 'green' },
  medium: { width: 30, height: 36, symbol: 'pink' },
  large: { width: 36, height: 44, symbol: 'red' },
};

/**
 * now_score 구간에 따라 지도 마커의 시각 표현을 결정한다.
 * - nowScore >= 80 → large (가장 진한 색·큰 마커)
 * - 50 <= nowScore < 80 → medium
 * - nowScore < 50 또는 null/undefined → small
 */
export function resolveMarkerStyle(nowScore: number | null | undefined): MarkerStyle {
  let tier: MarkerTier;
  if (nowScore == null) {
    tier = 'small';
  } else if (nowScore >= 80) {
    tier = 'large';
  } else if (nowScore >= 50) {
    tier = 'medium';
  } else {
    tier = 'small';
  }

  return { tier, ...TIER_STYLES[tier] };
}
