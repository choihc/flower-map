import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import TestRenderer, { act } from 'react-test-renderer';

const markerOverlaySpy = vi.fn();
const mapViewSpy = vi.fn();

vi.mock('@mj-studio/react-native-naver-map', () => ({
  NaverMapView: (props: Record<string, unknown> & { children?: React.ReactNode }) => {
    mapViewSpy(props);
    return React.createElement(React.Fragment, null, props.children);
  },
  NaverMapMarkerOverlay: (props: Record<string, unknown>) => {
    markerOverlaySpy(props);
    return null;
  },
}));

import { NaverMapCanvas } from '../NaverMapCanvas';

describe('NaverMapCanvas', () => {
  it('초기 카메라와 마커를 렌더링합니다', () => {
    act(() => {
      TestRenderer.create(
        <NaverMapCanvas
          latitude={37.5665}
          longitude={126.978}
          markerLatitude={37.5665}
          markerLongitude={126.978}
          onMarkerTap={() => {}}
        />,
      );
    });

    expect(mapViewSpy).toHaveBeenCalled();
    expect(markerOverlaySpy).toHaveBeenCalled();

    const mapProps = mapViewSpy.mock.calls[0]?.[0] as {
      initialCamera?: { latitude: number; longitude: number; zoom?: number };
    };
    expect(mapProps.initialCamera).toMatchObject({
      latitude: 37.5665,
      longitude: 126.978,
      zoom: 11,
    });

    const markerProps = markerOverlaySpy.mock.calls[0]?.[0] as {
      latitude?: number;
      longitude?: number;
      caption?: { text: string };
      onTap?: () => void;
    };
    expect(markerProps.latitude).toBe(37.5665);
    expect(markerProps.longitude).toBe(126.978);
    expect(markerProps.caption?.text).toBe('꽃 명소');
    expect(typeof markerProps.onTap).toBe('function');
  });
});
