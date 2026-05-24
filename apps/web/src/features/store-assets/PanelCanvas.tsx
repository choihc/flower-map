import React from 'react';

import {
  DESIGN_BASE_W,
  DESIGN_SIZE,
  FONT,
  PALETTES,
  PETAL_TINT,
  PHONE_FRAME,
  TYPO_BASE,
  type Platform,
} from './designTokens';
import { PhoneFrame } from './PhoneFrame';
import type { PanelConfig } from './panels';

type PanelCanvasProps = {
  panel: PanelConfig;
  platform: Platform;
  screenshotDataUrl: string | null;
};

export function PanelCanvas({ panel, platform, screenshotDataUrl }: PanelCanvasProps) {
  const { width, height } = DESIGN_SIZE[platform];
  const scale = width / DESIGN_BASE_W;
  const palette = PALETTES[panel.palette];
  const phoneWidth = width * PHONE_FRAME.widthRatio;
  const phoneBottom = PHONE_FRAME.bottomOffsetBase * scale;
  const edge = TYPO_BASE.edgePadding * scale;

  return (
    <div
      data-panel-slug={panel.slug}
      data-platform={platform}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        position: 'relative',
        overflow: 'hidden',
        background: `linear-gradient(155deg, ${palette.from} 0%, ${palette.to} 100%)`,
        color: palette.ink,
        fontFamily: FONT.sans,
      }}
    >
      <Petals tint={PETAL_TINT} accent={palette.accent} />

      {panel.isNew ? (
        <span
          data-testid="new-badge"
          style={{
            position: 'absolute',
            top: edge,
            left: edge,
            padding: `${TYPO_BASE.newBadgePadY * scale}px ${TYPO_BASE.newBadgePadX * scale}px`,
            background: palette.accent,
            color: '#fff',
            borderRadius: 999,
            fontSize: TYPO_BASE.newBadgePx * scale,
            fontWeight: 800,
            letterSpacing: 1.2 * scale,
            zIndex: 3,
          }}
        >
          NEW
        </span>
      ) : null}

      <div
        style={{
          position: 'absolute',
          top:
            (panel.isNew ? TYPO_BASE.headlineTopWithBadge : TYPO_BASE.headlineTopWithoutBadge) *
            scale,
          left: edge,
          right: edge,
          zIndex: 3,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontFamily: FONT.serif,
            fontSize: TYPO_BASE.headlinePx * scale,
            lineHeight: TYPO_BASE.headlineLineHeight,
            fontWeight: TYPO_BASE.headlineWeight,
            letterSpacing: TYPO_BASE.headlineLetterSpacing,
            color: palette.ink,
          }}
        >
          {panel.title.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </h1>
        <div
          style={{
            marginTop: TYPO_BASE.subheadMarginTop * scale,
            fontSize: TYPO_BASE.subheadPx * scale,
            lineHeight: TYPO_BASE.subheadLineHeight,
            fontWeight: 500,
            opacity: TYPO_BASE.subheadOpacity,
            letterSpacing: '-0.01em',
          }}
        >
          {panel.subtitle}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: phoneBottom,
          transform: `translateX(-50%) rotate(${PHONE_FRAME.tiltDeg}deg)`,
          transformOrigin: 'center center',
          zIndex: 2,
        }}
      >
        <PhoneFrame
          width={phoneWidth}
          screenshotDataUrl={screenshotDataUrl}
          ink={palette.ink}
          softBg={palette.soft}
          phoneNote={panel.phoneNote}
        />
      </div>

    </div>
  );
}

/**
 * 디자인 핸드오프의 Petals 컴포넌트 충실 구현.
 * viewBox 100×217(캔버스 비율 308:668과 일치), preserveAspectRatio="xMidYMid slice"로
 * 캔버스에 꽉 차게 그려진다.
 */
function Petals({ tint, accent }: { tint: string; accent: string }) {
  // 디자인 코드의 items 좌표를 그대로 사용한다.
  const items: ReadonlyArray<{
    type: 'p' | 'f';
    x: number;
    y: number;
    s: number;
    r: number;
    o: number;
    blur: number;
  }> = [
    { type: 'p', x: 88, y: 14, s: 1.4, r: 28, o: 0.9, blur: 0 },
    { type: 'p', x: 78, y: 36, s: 0.9, r: -42, o: 0.6, blur: 0.4 },
    { type: 'f', x: 92, y: 62, s: 1.5, r: 12, o: 0.85, blur: 0 },
    { type: 'p', x: 6, y: 88, s: 1.1, r: 145, o: 0.7, blur: 0.3 },
    { type: 'p', x: 14, y: 118, s: 0.7, r: -110, o: 0.5, blur: 0.5 },
    { type: 'p', x: 95, y: 128, s: 1.0, r: 95, o: 0.65, blur: 0.4 },
    { type: 'p', x: 4, y: 168, s: 1.3, r: 200, o: 0.8, blur: 0 },
    { type: 'f', x: 90, y: 190, s: 1.0, r: -20, o: 0.7, blur: 0.3 },
    { type: 'p', x: 22, y: 202, s: 0.8, r: 165, o: 0.55, blur: 0.5 },
  ];

  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 100 217"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}
      aria-hidden
    >
      <defs>
        <linearGradient id="pet-main" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.85" />
          <stop offset="55%" stopColor={tint} stopOpacity="0.9" />
          <stop offset="100%" stopColor={tint} stopOpacity="0.75" />
        </linearGradient>
        <linearGradient id="pet-main-h" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <filter id="petal-blur-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.4" />
        </filter>
      </defs>
      {items.map((it, i) => (
        <g
          key={i}
          transform={`translate(${it.x} ${it.y}) rotate(${it.r}) scale(${it.s})`}
          opacity={it.o}
          filter={it.blur ? 'url(#petal-blur-soft)' : undefined}
        >
          {it.type === 'f' ? (
            <Sakura tint={tint} centerColor={accent} />
          ) : (
            <Petal tint={tint} />
          )}
        </g>
      ))}
    </svg>
  );
}

/** 사쿠라 꽃잎 한 장 (디자인 핸드오프의 path 그대로). 끝(0,0) → 아래로 펴짐, 폭 10 × 높이 14 unit. */
function Petal({ tint }: { tint: string }) {
  return (
    <g>
      <path
        d="M 0 0 C 4 3, 6 7, 5 11 C 4.5 12.6, 3 13.4, 1 13 L 0 12.2 L -1 13 C -3 13.4, -4.5 12.6, -5 11 C -6 7, -4 3, 0 0 Z"
        fill="url(#pet-main)"
        stroke={tint}
        strokeWidth="0.15"
        strokeOpacity="0.5"
      />
      <path
        d="M -1.4 2.8 C -3 5.5, -4 8, -3.4 10.8 C -3.0 11.4, -2.4 11.7, -1.8 11.5 C -1.8 9, -1.9 6, -1.4 2.8 Z"
        fill="url(#pet-main-h)"
      />
    </g>
  );
}

/** 사쿠라 통꽃 — 꽃잎 5장이 모인 형태. 중앙 점에 accent 색. */
function Sakura({ tint, centerColor }: { tint: string; centerColor: string }) {
  return (
    <g>
      {[0, 72, 144, 216, 288].map((deg) => (
        <g key={deg} transform={`rotate(${deg}) translate(0 -2) scale(0.55)`}>
          <Petal tint={tint} />
        </g>
      ))}
      <circle r="1.3" fill={centerColor} opacity="0.85" />
    </g>
  );
}
