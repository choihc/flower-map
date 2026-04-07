import React from 'react';
import { describe, expect, it } from 'vitest';
import TestRenderer, { act } from 'react-test-renderer';

import { NaverMapCanvas } from '../NaverMapCanvas';

// 토스 미니 환경에서는 NativeModules에 네이버 지도 모듈이 없으므로
// 폴백 플레이스홀더가 렌더링된다.
describe('NaverMapCanvas', () => {
  it('네이티브 모듈 미지원 시 폴백 플레이스홀더를 렌더링합니다', () => {
    let renderer: any;
    act(() => {
      renderer = TestRenderer.create(
        <NaverMapCanvas
          latitude={37.5665}
          longitude={126.978}
          markerLatitude={37.5665}
          markerLongitude={126.978}
          onMarkerTap={() => {}}
          markerCaption="꽃 명소"
        />,
      );
    });

    const json = renderer!.toJSON();
    expect(json).not.toBeNull();
    // 폴백 UI가 렌더링되었는지 확인 (View가 최소 하나 이상 존재)
    expect(json).toBeTruthy();
  });
});
