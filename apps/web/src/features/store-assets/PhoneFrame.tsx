import React from 'react';

import { FONT, PHONE_FRAME } from './designTokens';

type PhoneFrameProps = {
  width: number;
  screenshotDataUrl: string | null;
  /** 팔레트의 ink(텍스트), soft(폰 내부 배경) */
  ink: string;
  softBg: string;
  /** 폰 내부 placeholder 라벨(예: "지도 + 숙소 카드") */
  phoneNote: string;
};

/**
 * 디자인 핸드오프 PhoneFrame 충실 구현. 검정 베젤 + soft 컬러 내부 + 다이내믹 아일랜드 + 홈 인디케이터.
 * 스크린샷이 있을 때는 다이내믹 아일랜드/홈 인디케이터가 위에 덮인다.
 */
export function PhoneFrame({ width, screenshotDataUrl, ink, softBg, phoneNote }: PhoneFrameProps) {
  const height = width * PHONE_FRAME.aspect;
  const padding = width * 0.025;
  const corner = width * 0.13;
  const innerCorner = width * 0.105;

  return (
    <div
      data-testid="phone-frame"
      style={{
        width,
        height,
        borderRadius: corner,
        background: '#0a0a0a',
        padding,
        boxShadow: `0 ${width * 0.12}px ${width * 0.25}px rgba(40,20,60,0.28), 0 ${width * 0.02}px ${width * 0.06}px rgba(0,0,0,0.18)`,
        position: 'relative',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: innerCorner,
          background: softBg,
          position: 'relative',
          overflow: 'hidden',
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
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: width * 0.04,
              fontFamily: FONT.mono,
              color: ink,
            }}
          >
            <div style={{ fontSize: width * 0.058, opacity: 0.45, letterSpacing: 0.5 }}>
              {phoneNote}
            </div>
            <div style={{ fontSize: width * 0.05, opacity: 0.3 }}>screenshot.png</div>
          </div>
        )}

        {/* 다이내믹 아일랜드 */}
        <div
          data-testid="dynamic-island"
          style={{
            position: 'absolute',
            top: width * 0.04,
            left: '50%',
            transform: 'translateX(-50%)',
            width: width * 0.32,
            height: width * 0.075,
            borderRadius: 999,
            background: '#0a0a0a',
            zIndex: 2,
          }}
        />

        {/* 홈 인디케이터 */}
        <div
          data-testid="home-indicator"
          style={{
            position: 'absolute',
            bottom: width * 0.045,
            left: '50%',
            transform: 'translateX(-50%)',
            width: width * 0.35,
            height: width * 0.018,
            borderRadius: 999,
            background: ink,
            opacity: 0.4,
            zIndex: 2,
          }}
        />
      </div>
    </div>
  );
}
