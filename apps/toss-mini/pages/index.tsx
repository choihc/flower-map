import { createRoute } from '@granite-js/react-native';
import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { NaverMapCanvas } from '../src/features/map/components/NaverMapCanvas';
import { SelectedSpotCard } from '../src/features/map/components/SelectedSpotCard';

export const Route = createRoute('/', {
  component: HomePage,
});

function HomePage() {
  const selectedSpot = {
    id: 'yeouido-hangang-park',
    place: '여의도 한강공원',
    flower: '벚꽃',
    helper: '한강 산책과 벚꽃 마커 탭 흐름을 먼저 검증합니다.',
  };

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Apps in Toss Spike</Text>
        <Text style={styles.title}>네이버지도 렌더링 검증</Text>
        <Text style={styles.subtitle}>
          지도 렌더링, 마커 탭, 카드 액션까지 한 화면에서 우선 확인합니다.
        </Text>
      </View>

      <View style={styles.mapSection}>
        <NaverMapCanvas
          latitude={37.5288}
          longitude={126.9291}
          markerLatitude={37.5288}
          markerLongitude={126.9291}
          onMarkerTap={() => {
            Alert.alert('마커 탭 감지', '여의도 한강공원 마커 이벤트가 연결되었습니다.');
          }}
        />
      </View>

      <SelectedSpotCard
        spot={selectedSpot}
        onPressDetail={() => {
          Alert.alert('상세 보기', '다음 단계에서 상세 라우트를 연결합니다.');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    color: '#5C9E66',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  header: {
    gap: 8,
    marginBottom: 18,
  },
  mapSection: {
    flex: 1,
    marginBottom: 18,
    minHeight: 320,
  },
  page: {
    flex: 1,
    backgroundColor: '#F4F8F4',
    padding: 20,
  },
  subtitle: {
    color: '#5E7262',
    fontSize: 14,
    lineHeight: 20,
  },
  title: {
    color: '#142218',
    fontSize: 28,
    fontWeight: '800',
  },
});
