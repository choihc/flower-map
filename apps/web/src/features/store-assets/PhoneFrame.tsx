import React from 'react';

import { PHONE_FRAME } from './designTokens';

type PhoneFrameProps = {
  width: number;
  screenshotDataUrl: string | null;
};

/**
 * 9:19.5 비율 검정 라운드 폰 + 다이내믹 아일랜드. 레퍼런스 디자인을 따라 복원했다.
 * 사이즈는 props.width 기준 비율 계산.
 */
export function PhoneFrame({ width, screenshotDataUrl }: PhoneFrameProps) {
  const height = width * PHONE_FRAME.aspect;
  const corner = width * PHONE_FRAME.cornerRadiusRatio;
  const bezel = width * PHONE_FRAME.bezelRatio;
  const innerWidth = width - bezel * 2;
  const innerHeight = height - bezel * 2;
  const innerCorner = corner - bezel;

  const islandWidth = width * PHONE_FRAME.islandWidthRatio;
  const islandHeight = width * PHONE_FRAME.islandHeightRatio;
  const islandTop = bezel + width * PHONE_FRAME.islandTopRatio;

  return (
    <div
      data-testid="phone-frame"
      style={{
        width,
        height,
        background: '#0d0d0f',
        borderRadius: corner,
        position: 'relative',
        boxShadow: '0 36px 80px rgba(50,30,55,0.25), 0 8px 20px rgba(50,30,55,0.18)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: bezel,
          left: bezel,
          width: innerWidth,
          height: innerHeight,
          borderRadius: innerCorner,
          overflow: 'hidden',
          background: '#FAF4F2',
        }}
      >
        {screenshotDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={screenshotDataUrl}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : null}
      </div>
      <div
        data-testid="dynamic-island"
        style={{
          position: 'absolute',
          top: islandTop,
          left: (width - islandWidth) / 2,
          width: islandWidth,
          height: islandHeight,
          background: '#0a0a0a',
          borderRadius: islandHeight / 2,
        }}
      />
    </div>
  );
}
