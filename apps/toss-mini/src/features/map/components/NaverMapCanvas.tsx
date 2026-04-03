import React from 'react';
import { NativeModules, StyleSheet, Text, View } from 'react-native';

type NaverMapCanvasProps = {
  latitude: number;
  longitude: number;
  markerLatitude: number;
  markerLongitude: number;
  onMarkerTap: () => void;
  markerCaption?: string;
};

// 토스 미니 샌드박스에서는 네이버 지도 네이티브 모듈이 미지원
const isNaverMapAvailable = Boolean(NativeModules?.RNCNaverMapView ?? NativeModules?.NaverMap);

export function NaverMapCanvas({
  latitude,
  longitude,
  markerCaption = '꽃 명소',
}: NaverMapCanvasProps) {
  if (!isNaverMapAvailable) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.pinIcon}>📍</Text>
        <Text style={styles.placeName}>{markerCaption}</Text>
        <Text style={styles.coords}>
          {latitude.toFixed(4)}, {longitude.toFixed(4)}
        </Text>
        <Text style={styles.notice}>지도는 정식 앱에서 확인하세요</Text>
      </View>
    );
  }

  // 네이티브 모듈이 있을 때만 임포트해서 렌더링
  const { NaverMapMarkerOverlay, NaverMapView } = require('@mj-studio/react-native-naver-map');
  return (
    <View style={styles.container}>
      <NaverMapView
        style={styles.map}
        initialCamera={{ latitude, longitude, zoom: 11 }}
        isShowCompass
        isShowScaleBar={false}
        isShowZoomControls={false}
      >
        <NaverMapMarkerOverlay
          latitude={latitude}
          longitude={longitude}
          caption={{ text: markerCaption }}
        />
      </NaverMapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 320,
    overflow: 'hidden',
    borderRadius: 24,
  },
  map: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    minHeight: 320,
    backgroundColor: '#FDE8F0',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  pinIcon: {
    fontSize: 36,
  },
  placeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3D1A27',
  },
  coords: {
    fontSize: 12,
    color: '#8B5A6E',
  },
  notice: {
    fontSize: 12,
    color: '#B09099',
    marginTop: 4,
  },
});
