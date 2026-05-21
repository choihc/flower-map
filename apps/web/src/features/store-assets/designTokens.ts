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
 * 폰 프레임: 9:19.5 비율. 최신 스토어 스크린샷 트렌드를 반영해 다이내믹 아일랜드는 그리지 않는다.
 * 클로즈업 사선 배치로 폰 상단 자체가 화면 밖으로 잘리므로 추가 safe area도 불필요.
 */
export const PHONE_FRAME = {
  aspect: 19.5 / 9,
  cornerRadiusRatio: 0.07,
  bezelRatio: 0.012,
};

/**
 * 클로즈업 폰 배치 계수. 폰을 우하단에서 살짝 기울인 사선으로 들어오게 배치한다.
 * - widthRatio: 캔버스 폭 대비 폰 폭
 * - rightOffsetRatio / bottomOffsetRatio: 캔버스 우/하단을 기준으로 폰이 밖으로 밀려나간 비율(음의 right/bottom 값)
 * - tiltDeg: 폰의 반시계 방향 회전각(절댓값)
 */
export const PHONE_LAYOUT: Record<
  Platform,
  { widthRatio: number; rightOffsetRatio: number; bottomOffsetRatio: number; tiltDeg: number }
> = {
  // iOS(1242×2688, 비율 2.16): 폰 ~969×2099, 폰의 좌상단이 캔버스의 우측 절반 아래쪽에서 시작
  ios: { widthRatio: 0.78, rightOffsetRatio: 0.18, bottomOffsetRatio: 0.2, tiltDeg: 8 },
  // Android(1080×1920, 비율 1.78): 가로 비율이 더 크므로 폰을 더 좁게
  android: { widthRatio: 0.65, rightOffsetRatio: 0.13, bottomOffsetRatio: 0.15, tiltDeg: 8 },
};

export const TYPO = {
  /** closeup 레이아웃: 좌상단 카피 영역 */
  headlinePx: 130,
  headlineLineHeight: 1.12,
  headlineWeight: 800,
  subheadPx: 50,
  subheadLineHeight: 1.32,
  subheadWeight: 500,
  subheadColor: '#5a3f4a',
  /** impact 레이아웃(1번 NEW 패널): 가운데 거대 타이포 */
  impactHeadlinePx: 168,
  impactHeadlineLineHeight: 1.08,
  impactSubheadPx: 56,
  /** NEW 배지 */
  newBadgePx: 52,
  newBadgePadX: 0.034,
  newBadgePadY: 0.016,
  newBadgeBg: '#FF7B9C',
  newBadgeFg: '#FFFFFF',
  /** 해시태그 칩 */
  tagPx: 42,
  tagPadX: 0.026,
  tagPadY: 0.012,
  tagBg: 'rgba(255,255,255,0.78)',
  tagFg: '#8b3d5f',
};
