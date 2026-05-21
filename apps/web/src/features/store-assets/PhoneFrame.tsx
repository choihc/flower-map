import React from 'react';

import { PHONE_FRAME } from './designTokens';

type PhoneFrameProps = {
  width: number;
  screenshotDataUrl: string | null;
};

/**
 * 9:19.5 비율의 검정 라운드 폰 목업. 다이내믹 아일랜드 포함.
 * 모든 사이즈는 props.width 기준으로 비율 계산되어 캔버스 스케일에 의존하지 않는다.
 */
export function PhoneFrame({ width, screenshotDataUrl }: PhoneFrameProps) {
  const height = width * PHONE_FRAME.aspect;
  const corner = width * PHONE_FRAME.cornerRadiusRatio;
  const bezel = width * PHONE_FRAME.bezelRatio;
  const innerWidth = width - bezel * 2;
  const innerHeight = height - bezel * 2;
  const innerCorner = corner - bezel;
  const safeAreaTop = width * PHONE_FRAME.safeAreaTopRatio;

  const islandWidth = width * 0.32;
  const islandHeight = width * 0.08;
  const islandTop = bezel + width * 0.025;

  return (
    <div
      style={{
        width,
        height,
        background: '#0a0a0a',
        borderRadius: corner,
        position: 'relative',
        boxShadow: '0 30px 60px rgba(0,0,0,0.18)',
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
          background: '#ffffff',
        }}
      >
        {screenshotDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={screenshotDataUrl}
            alt=""
            style={{
              position: 'absolute',
              top: safeAreaTop,
              left: 0,
              width: '100%',
              height: innerHeight - safeAreaTop,
              objectFit: 'cover',
              display: 'block',
            }}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              top: safeAreaTop,
              left: 0,
              width: '100%',
              height: innerHeight - safeAreaTop,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: width * 0.04,
              color: '#9b9b9b',
              background: '#f3f3f3',
            }}
          >
            스크린샷 업로드
          </div>
        )}
      </div>
      <div
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
