import React from 'react';

import { DESIGN_SIZE, PHONE_FRAME, PHONE_LAYOUT, TYPO, type Platform } from './designTokens';
import { PhoneFrame } from './PhoneFrame';
import type { PanelConfig } from './panels';

type PanelCanvasProps = {
  panel: PanelConfig;
  platform: Platform;
  screenshotDataUrl: string | null;
};

export function PanelCanvas({ panel, platform, screenshotDataUrl }: PanelCanvasProps) {
  const { width, height } = DESIGN_SIZE[platform];
  const layout = PHONE_LAYOUT[platform];
  const phoneWidth = width * layout.widthRatio;
  const phoneHeight = phoneWidth * PHONE_FRAME.aspect;
  const headlinePadding = width * 0.07;

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
        fontFamily:
          'Pretendard, "Pretendard Variable", -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", system-ui, sans-serif',
        color: '#1f1f1f',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: height * 0.08,
          left: headlinePadding,
          right: headlinePadding,
          display: 'flex',
          flexDirection: 'column',
          gap: width * 0.025,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: width * 0.02, flexWrap: 'wrap' }}>
          <h1
            style={{
              margin: 0,
              fontSize: TYPO.headlinePx,
              lineHeight: TYPO.headlineLineHeight,
              fontWeight: TYPO.headlineWeight,
              letterSpacing: '-0.02em',
            }}
          >
            {panel.headline}
          </h1>
          {panel.isNew ? (
            <span
              data-testid="new-badge"
              style={{
                display: 'inline-block',
                padding: `${width * TYPO.newBadgePadY}px ${width * TYPO.newBadgePadX}px`,
                fontSize: TYPO.newBadgePx,
                fontWeight: 800,
                color: TYPO.newBadgeFg,
                background: TYPO.newBadgeBg,
                borderRadius: 999,
              }}
            >
              NEW
            </span>
          ) : null}
        </div>
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

      {/* 폰을 캔버스 하단에 배치. bottomCutRatio만큼 캔버스 세로 기준으로 잘림. */}
      <div
        style={{
          position: 'absolute',
          top: height - phoneHeight + height * layout.bottomCutRatio,
          left: (width - phoneWidth) / 2,
        }}
      >
        <PhoneFrame width={phoneWidth} screenshotDataUrl={screenshotDataUrl} />
      </div>
    </div>
  );
}
