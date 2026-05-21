import React from 'react';

import { DESIGN_SIZE, FONT, PHONE_LAYOUT, TYPO, type Platform } from './designTokens';
import { PhoneFrame } from './PhoneFrame';
import { PANELS, type PanelConfig } from './panels';

type PanelCanvasProps = {
  panel: PanelConfig;
  platform: Platform;
  screenshotDataUrl: string | null;
};

const SEASON_LABEL = 'SPRING · 2026';
const TOTAL_PANELS = PANELS.length;

export function PanelCanvas({ panel, platform, screenshotDataUrl }: PanelCanvasProps) {
  const { width, height } = DESIGN_SIZE[platform];
  const layout = PHONE_LAYOUT[platform];
  const phoneWidth = width * layout.widthRatio;
  const padX = width * 0.07;
  const padY = height * 0.045;

  return (
    <div
      data-panel-slug={panel.slug}
      data-platform={platform}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        background: panel.background,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: FONT.sans,
        color: TYPO.headlineColor,
      }}
    >
      <BloomAccents width={width} height={height} />

      {/* 우상단: 페이지 번호 */}
      <div
        data-testid="page-number"
        style={{
          position: 'absolute',
          top: padY,
          right: padX,
          fontFamily: FONT.mono,
          fontSize: TYPO.pageNumberPx,
          color: TYPO.pageNumberColor,
          letterSpacing: TYPO.pageNumberTracking,
          fontWeight: 500,
          zIndex: 4,
        }}
      >
        {String(panel.index).padStart(2, '0')} / {String(TOTAL_PANELS).padStart(2, '0')}
      </div>

      {/* 좌상단: NEW 배지 + 헤드라인 + 서브헤드 */}
      <div
        style={{
          position: 'absolute',
          top: padY,
          left: padX,
          right: width * 0.12,
          display: 'flex',
          flexDirection: 'column',
          gap: width * 0.022,
          zIndex: 3,
        }}
      >
        {panel.isNew ? (
          <span
            data-testid="new-badge"
            style={{
              alignSelf: 'flex-start',
              padding: `${width * TYPO.newBadgePadY}px ${width * TYPO.newBadgePadX}px`,
              fontSize: TYPO.newBadgePx,
              fontWeight: 800,
              color: TYPO.newBadgeFg,
              background: TYPO.newBadgeBg,
              borderRadius: width * TYPO.newBadgeRadius,
              letterSpacing: TYPO.newBadgeTracking,
              fontFamily: FONT.mono,
              marginBottom: width * 0.012,
            }}
          >
            NEW
          </span>
        ) : null}
        <h1
          style={{
            margin: 0,
            fontFamily: FONT.headline,
            fontSize: TYPO.headlinePx,
            lineHeight: TYPO.headlineLineHeight,
            fontWeight: TYPO.headlineWeight,
            letterSpacing: TYPO.headlineLetterSpacing,
            whiteSpace: 'pre-line',
            color: TYPO.headlineColor,
          }}
        >
          {panel.headline}
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: TYPO.subheadPx,
            lineHeight: TYPO.subheadLineHeight,
            fontWeight: TYPO.subheadWeight,
            color: TYPO.subheadColor,
            marginTop: width * 0.01,
          }}
        >
          {panel.subhead}
        </p>
      </div>

      {/* 좌하단: 폰 목업 (캔버스 폭의 ~78%, 하단 ~34% 잘림) */}
      <div
        style={{
          position: 'absolute',
          left: width * layout.leftInsetRatio,
          bottom: -height * layout.bottomOverflowRatio,
          transform: layout.tiltDeg ? `rotate(${layout.tiltDeg}deg)` : undefined,
          transformOrigin: 'bottom left',
          zIndex: 2,
        }}
      >
        <PhoneFrame width={phoneWidth} screenshotDataUrl={screenshotDataUrl} />
      </div>

      {/* 좌하단 푸터 텍스트 (폰 위에 겹쳐 표시) */}
      <div
        data-testid="footer-label"
        style={{
          position: 'absolute',
          bottom: height * 0.045,
          left: padX,
          fontFamily: FONT.mono,
          fontSize: TYPO.footerPx,
          color: TYPO.footerColor,
          letterSpacing: TYPO.footerTracking,
          fontWeight: 500,
          textTransform: 'uppercase',
          lineHeight: 1.7,
          zIndex: 5,
        }}
      >
        <div>
          {SEASON_LABEL} · {panel.footerLabel}
        </div>
        <div style={{ textTransform: 'none', opacity: 0.85 }}>screenshot.png</div>
      </div>
    </div>
  );
}

/**
 * 꽃잎·꽃 어센트. 큰 꽃잎 위주로 임팩트 있게 배치하고, 사실감을 위해 SVG blur·다중 그라데이션 적용.
 * 좌표는 캔버스 비율 기준이라 iOS/Android 모두 동일 위치 비율로 흩뿌려진다.
 */
function BloomAccents({ width, height }: { width: number; height: number }) {
  // 큰 임팩트 꽃잎 — 우상단 카피 옆, 좌중단 폰 옆 등 시선을 끄는 위치 (선명)
  const bigPetals = [
    { cx: 0.82, cy: 0.07, r: 0.085, rot: 25, opacity: 0.95, blur: 0 },
    { cx: 0.95, cy: 0.16, r: 0.055, rot: -30, opacity: 0.85, blur: 0 },
    { cx: 0.03, cy: 0.53, r: 0.085, rot: -25, opacity: 0.92, blur: 0 },
    { cx: 0.06, cy: 0.65, r: 0.075, rot: 50, opacity: 0.85, blur: 1 },
    { cx: 0.78, cy: 0.92, r: 0.06, rot: -15, opacity: 0.85, blur: 0 },
  ];
  // 약한 블러 꽃잎 — 깊이감을 더하되 형태는 보이게
  const blurPetals = [
    { cx: 0.18, cy: 0.4, r: 0.05, rot: 60, opacity: 0.7, blur: 2 },
    { cx: 0.92, cy: 0.42, r: 0.04, rot: 15, opacity: 0.65, blur: 2 },
    { cx: 0.4, cy: 0.8, r: 0.05, rot: -10, opacity: 0.7, blur: 2 },
    { cx: 0.92, cy: 0.78, r: 0.045, rot: 30, opacity: 0.7, blur: 1 },
    { cx: 0.2, cy: 0.92, r: 0.04, rot: 20, opacity: 0.65, blur: 2 },
  ];
  const allPetals = [...bigPetals, ...blurPetals];

  // 큰 꽃(우상단 헤드라인 옆)
  const bigFlower = { cx: 0.88, cy: 0.13, r: 0.055 };
  // 작은 강조 점꽃
  const smallFlowers = [
    { cx: 0.97, cy: 0.42, r: 0.018 },
    { cx: 0.95, cy: 0.78, r: 0.02 },
  ];

  return (
    <svg
      width={width}
      height={height}
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 1 }}
      aria-hidden
    >
      <defs>
        <radialGradient id="petalFill" cx="32%" cy="28%" r="78%">
          <stop offset="0%" stopColor="#FFFAFB" />
          <stop offset="35%" stopColor="#FFD0DD" />
          <stop offset="75%" stopColor="#F59FB8" />
          <stop offset="100%" stopColor="#DC7A99" />
        </radialGradient>
        <radialGradient id="flowerFill" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#FFE0E8" />
          <stop offset="100%" stopColor="#E78FAE" />
        </radialGradient>
        <filter id="petalBlur1" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
        <filter id="petalBlur2" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>

      {allPetals.map((p, i) => {
        const cx = width * p.cx;
        const cy = height * p.cy;
        const r = width * p.r;
        const filter = p.blur >= 2 ? 'url(#petalBlur2)' : p.blur >= 1 ? 'url(#petalBlur1)' : undefined;
        return (
          <g
            key={`petal-${i}`}
            transform={`translate(${cx} ${cy}) rotate(${p.rot})`}
            opacity={p.opacity}
            filter={filter}
          >
            <path
              d={`M 0 ${-r} C ${r * 0.55} ${-r * 0.75}, ${r * 0.6} ${r * 0.4}, 0 ${r} C ${-r * 0.6} ${r * 0.4}, ${-r * 0.55} ${-r * 0.75}, 0 ${-r} Z`}
              fill="url(#petalFill)"
            />
          </g>
        );
      })}

      <FlowerBlossom
        cx={width * bigFlower.cx}
        cy={height * bigFlower.cy}
        r={width * bigFlower.r}
        opacity={0.92}
      />

      {smallFlowers.map((f, i) => (
        <FlowerBlossom
          key={`sm-${i}`}
          cx={width * f.cx}
          cy={height * f.cy}
          r={width * f.r}
          opacity={0.9}
        />
      ))}
    </svg>
  );
}

function FlowerBlossom({
  cx,
  cy,
  r,
  opacity = 1,
}: {
  cx: number;
  cy: number;
  r: number;
  opacity?: number;
}) {
  const petalCount = 5;
  const petalLen = r;
  const petalWide = r * 0.62;
  const angles = Array.from({ length: petalCount }, (_, i) => (360 / petalCount) * i);
  return (
    <g transform={`translate(${cx} ${cy})`} opacity={opacity}>
      {angles.map((deg, i) => (
        <ellipse
          key={i}
          cx={0}
          cy={-petalLen * 0.55}
          rx={petalWide / 2}
          ry={petalLen * 0.58}
          fill="url(#flowerFill)"
          transform={`rotate(${deg})`}
        />
      ))}
      <circle cx={0} cy={0} r={r * 0.2} fill="#9A5E78" opacity={0.9} />
    </g>
  );
}
