import React from 'react';

import { PHONE_FRAME } from './designTokens';

type PhoneFrameProps = {
  width: number;
  screenshotDataUrl: string | null;
};

/**
 * 9:19.5 비율의 검정 라운드 폰 목업. 최신 스토어 스크린샷 트렌드를 반영해
 * 다이내믹 아일랜드는 그리지 않는다(클로즈업 사선 배치로 상단이 자연스레 잘리므로 불필요).
 * 모든 사이즈는 props.width 기준으로 비율 계산되어 캔버스 스케일에 의존하지 않는다.
 */
export function PhoneFrame({ width, screenshotDataUrl }: PhoneFrameProps) {
  const height = width * PHONE_FRAME.aspect;
  const corner = width * PHONE_FRAME.cornerRadiusRatio;
  const bezel = width * PHONE_FRAME.bezelRatio;
  const innerWidth = width - bezel * 2;
  const innerHeight = height - bezel * 2;
  const innerCorner = corner - bezel;

  return (
    <div
      data-testid="phone-frame"
      style={{
        width,
        height,
        background: '#0a0a0a',
        borderRadius: corner,
        position: 'relative',
        boxShadow: '0 30px 60px rgba(0,0,0,0.22)',
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
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
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
    </div>
  );
}
