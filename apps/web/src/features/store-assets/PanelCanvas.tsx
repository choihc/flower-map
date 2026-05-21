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
  const padY = height * 0.06;

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
          right: width * 0.32, // 우측 큰 꽃 자리 비워두기
          display: 'flex',
          flexDirection: 'column',
          gap: width * 0.022,
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
          }}
        >
          {panel.subhead}
        </p>
      </div>

      {/* 좌하단: 폰 목업 */}
      <div
        style={{
          position: 'absolute',
          left: -width * layout.leftOffsetRatio,
          bottom: -height * layout.bottomOffsetRatio,
          transform: layout.tiltDeg ? `rotate(${layout.tiltDeg}deg)` : undefined,
          transformOrigin: 'bottom left',
        }}
      >
        <PhoneFrame width={phoneWidth} screenshotDataUrl={screenshotDataUrl} />
      </div>

      {/* 좌하단 푸터 텍스트 (폰 위에 겹쳐 표시) */}
      <div
        data-testid="footer-label"
        style={{
          position: 'absolute',
          bottom: padY * 0.6,
          left: padX,
          fontFamily: FONT.mono,
          fontSize: TYPO.footerPx,
          color: TYPO.footerColor,
          letterSpacing: TYPO.footerTracking,
          fontWeight: 500,
          textTransform: 'uppercase',
          lineHeight: 1.6,
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
 * 꽃잎·작은 꽃 어센트. SVG로 그려 PNG 캡처에서도 깨지지 않게 한다.
 * 좌표는 캔버스 비율 기준이라 iOS/Android 모두 동일 위치 비율로 흩뿌려진다.
 */
function BloomAccents({ width, height }: { width: number; height: number }) {
  // 큰 꽃(우측 상단, 헤드라인 옆)
  const bigFlower = { cx: 0.82, cy: 0.13, r: 0.07 };
  // 작은 꽃(곳곳에 강조)
  const smallFlowers = [
    { cx: 0.55, cy: 0.18, r: 0.025 },
    { cx: 0.88, cy: 0.55, r: 0.022 },
  ];
  // 꽃잎(체리블라썸 잎 모양, 여러 개 흩뿌림)
  const petals = [
    { cx: 0.04, cy: 0.32, r: 0.045, rot: -20, opacity: 0.7 },
    { cx: 0.74, cy: 0.06, r: 0.055, rot: 28, opacity: 0.85 },
    { cx: 0.92, cy: 0.16, r: 0.038, rot: -35, opacity: 0.7 },
    { cx: 0.18, cy: 0.45, r: 0.035, rot: 50, opacity: 0.55 },
    { cx: 0.62, cy: 0.4, r: 0.04, rot: -10, opacity: 0.6 },
    { cx: 0.95, cy: 0.48, r: 0.032, rot: 25, opacity: 0.55 },
    { cx: 0.38, cy: 0.92, r: 0.04, rot: 15, opacity: 0.6 },
    { cx: 0.92, cy: 0.78, r: 0.045, rot: -40, opacity: 0.6 },
  ];

  return (
    <svg
      width={width}
      height={height}
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 1 }}
      aria-hidden
    >
      <defs>
        <radialGradient id="petalFill" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFF6F8" />
          <stop offset="55%" stopColor="#FFC0D2" />
          <stop offset="100%" stopColor="#F590B0" />
        </radialGradient>
        <radialGradient id="flowerFill" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#FFE0E8" />
          <stop offset="100%" stopColor="#F38FAE" />
        </radialGradient>
      </defs>

      {petals.map((p, i) => {
        const cx = width * p.cx;
        const cy = height * p.cy;
        const r = width * p.r;
        return (
          <g key={`petal-${i}`} transform={`translate(${cx} ${cy}) rotate(${p.rot})`} opacity={p.opacity}>
            <path
              d={`M0 ${-r} C ${r * 0.95} ${-r * 0.35}, ${r * 0.95} ${r * 0.35}, 0 ${r} C ${-r * 0.95} ${r * 0.35}, ${-r * 0.95} ${-r * 0.35}, 0 ${-r} Z`}
              fill="url(#petalFill)"
            />
          </g>
        );
      })}

      {/* 큰 꽃: 5장 꽃잎 + 중앙 점 */}
      <FlowerBlossom
        cx={width * bigFlower.cx}
        cy={height * bigFlower.cy}
        r={width * bigFlower.r}
        opacity={0.95}
      />

      {smallFlowers.map((f, i) => (
        <FlowerBlossom
          key={`sm-${i}`}
          cx={width * f.cx}
          cy={height * f.cy}
          r={width * f.r}
          opacity={0.85}
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
  const petalWide = r * 0.6;
  const petals = Array.from({ length: petalCount }, (_, i) => (360 / petalCount) * i);
  return (
    <g transform={`translate(${cx} ${cy})`} opacity={opacity}>
      {petals.map((deg, i) => (
        <ellipse
          key={i}
          cx={0}
          cy={-petalLen * 0.55}
          rx={petalWide / 2}
          ry={petalLen * 0.55}
          fill="url(#flowerFill)"
          transform={`rotate(${deg})`}
        />
      ))}
      <circle cx={0} cy={0} r={r * 0.18} fill="#E78FAE" opacity={0.85} />
    </g>
  );
}
