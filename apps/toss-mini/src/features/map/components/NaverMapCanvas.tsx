import React from 'react';
import { StyleSheet, View } from 'react-native';
import { NaverMapMarkerOverlay, NaverMapView } from '@mj-studio/react-native-naver-map';

type NaverMapCanvasProps = {
  latitude: number;
  longitude: number;
  markerLatitude: number;
  markerLongitude: number;
  onMarkerTap: () => void;
  markerCaption?: string;
};

export function NaverMapCanvas({
  latitude,
  longitude,
  markerLatitude,
  markerLongitude,
  onMarkerTap,
  markerCaption = '꽃 명소',
}: NaverMapCanvasProps) {
  return (
    <View style={styles.container}>
      <NaverMapView
        style={styles.map}
        initialCamera={{
          latitude,
          longitude,
          zoom: 11,
        }}
        isShowCompass
        isShowScaleBar={false}
        isShowZoomControls={false}
      >
        <NaverMapMarkerOverlay
          latitude={markerLatitude}
          longitude={markerLongitude}
          caption={{ text: markerCaption }}
          onTap={onMarkerTap}
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
});
