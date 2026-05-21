import React from 'react';

import { DESIGN_SIZE, PHONE_FRAME, PHONE_LAYOUT, TYPO, type Platform } from './designTokens';
import { PhoneFrame } from './PhoneFrame';
import type { PanelConfig } from './panels';

type PanelCanvasProps = {
  panel: PanelConfig;
  platform: Platform;
  screenshotDataUrl: string | null;
};

const FONT_STACK =
  'Pretendard, "Pretendard Variable", -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", system-ui, sans-serif';

export function PanelCanvas({ panel, platform, screenshotDataUrl }: PanelCanvasProps) {
  const { width, height } = DESIGN_SIZE[platform];

  return (
    <div
      data-panel-slug={panel.slug}
      data-platform={platform}
      data-layout={panel.layout}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        background: panel.background,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: FONT_STACK,
        color: '#1f1f1f',
      }}
    >
      {panel.layout === 'impact' ? (
        <ImpactLayout panel={panel} width={width} height={height} />
      ) : (
        <CloseupLayout
          panel={panel}
          width={width}
          height={height}
          platform={platform}
          screenshotDataUrl={screenshotDataUrl}
        />
      )}
    </div>
  );
}

function CloseupLayout({
  panel,
  width,
  height,
  platform,
  screenshotDataUrl,
}: {
  panel: PanelConfig;
  width: number;
  height: number;
  platform: Platform;
  screenshotDataUrl: string | null;
}) {
  const layout = PHONE_LAYOUT[platform];
  const phoneWidth = width * layout.widthRatio;
  const padX = width * 0.07;

  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: height * 0.08,
          left: padX,
          right: padX,
          display: 'flex',
          flexDirection: 'column',
          gap: width * 0.028,
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
              borderRadius: 999,
              letterSpacing: '0.04em',
            }}
          >
            NEW
          </span>
        ) : null}
        <h1
          style={{
            margin: 0,
            fontSize: TYPO.headlinePx,
            lineHeight: TYPO.headlineLineHeight,
            fontWeight: TYPO.headlineWeight,
            letterSpacing: '-0.025em',
            whiteSpace: 'pre-line',
            color: '#2a1a1f',
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

      <div
        style={{
          position: 'absolute',
          right: -width * layout.rightOffsetRatio,
          bottom: -height * layout.bottomOffsetRatio,
          transform: `rotate(-${layout.tiltDeg}deg)`,
          transformOrigin: 'bottom right',
        }}
      >
        <PhoneFrame width={phoneWidth} screenshotDataUrl={screenshotDataUrl} />
      </div>
    </>
  );
}

function ImpactLayout({
  panel,
  width,
  height,
}: {
  panel: PanelConfig;
  width: number;
  height: number;
}) {
  const padX = width * 0.09;

  return (
    <>
      <Petals width={width} height={height} />
      <div
        style={{
          position: 'absolute',
          top: height * 0.16,
          left: padX,
          right: padX,
          display: 'flex',
          flexDirection: 'column',
          gap: width * 0.03,
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
              borderRadius: 999,
              letterSpacing: '0.04em',
            }}
          >
            NEW
          </span>
        ) : null}
        <h1
          style={{
            margin: 0,
            fontSize: TYPO.impactHeadlinePx,
            lineHeight: TYPO.impactHeadlineLineHeight,
            fontWeight: TYPO.headlineWeight,
            letterSpacing: '-0.03em',
            whiteSpace: 'pre-line',
            color: '#2a1a1f',
          }}
        >
          {panel.headline}
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: TYPO.impactSubheadPx,
            lineHeight: TYPO.subheadLineHeight,
            fontWeight: TYPO.subheadWeight,
            color: TYPO.subheadColor,
          }}
        >
          {panel.subhead}
        </p>
        {panel.tags && panel.tags.length > 0 ? (
          <div
            data-testid="tag-row"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: width * 0.018,
              marginTop: width * 0.02,
            }}
          >
            {panel.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  padding: `${width * TYPO.tagPadY}px ${width * TYPO.tagPadX}px`,
                  fontSize: TYPO.tagPx,
                  fontWeight: 700,
                  color: TYPO.tagFg,
                  background: TYPO.tagBg,
                  borderRadius: 999,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </>
  );
}

/** 임팩트 패널의 흩날리는 꽃잎 어센트. SVG로 그려 PNG 캡처에서도 깨지지 않게 한다. */
function Petals({ width, height }: { width: number; height: number }) {
  const petals = [
    { cx: 0.18, cy: 0.08, r: 0.045, rot: 30, opacity: 0.55 },
    { cx: 0.78, cy: 0.13, r: 0.06, rot: -20, opacity: 0.7 },
    { cx: 0.86, cy: 0.6, r: 0.05, rot: 40, opacity: 0.55 },
    { cx: 0.1, cy: 0.62, r: 0.07, rot: -35, opacity: 0.7 },
    { cx: 0.5, cy: 0.92, r: 0.055, rot: 15, opacity: 0.6 },
    { cx: 0.32, cy: 0.78, r: 0.04, rot: 60, opacity: 0.5 },
  ];
  return (
    <svg
      width={width}
      height={height}
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
      aria-hidden
    >
      <defs>
        <radialGradient id="petalFill" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="60%" stopColor="#FFB7CC" />
          <stop offset="100%" stopColor="#FF7B9C" />
        </radialGradient>
      </defs>
      {petals.map((p, i) => {
        const cx = width * p.cx;
        const cy = height * p.cy;
        const r = width * p.r;
        return (
          <g key={i} transform={`translate(${cx} ${cy}) rotate(${p.rot})`} opacity={p.opacity}>
            <path
              d={`M0 ${-r} C ${r * 0.9} ${-r * 0.4}, ${r * 0.9} ${r * 0.4}, 0 ${r} C ${-r * 0.9} ${r * 0.4}, ${-r * 0.9} ${-r * 0.4}, 0 ${-r} Z`}
              fill="url(#petalFill)"
            />
          </g>
        );
      })}
    </svg>
  );
}
