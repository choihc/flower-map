import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ImageBackground, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { spotImages } from '../../../shared/mocks/spotAssets';
import { featuredSpots, flowerLabels, type FlowerSpot } from '../../../shared/mocks/spots';
import { colors } from '../../../shared/theme/colors';
import { BloomArt } from '../../../shared/ui/BloomArt';
import { ScreenShell } from '../../../shared/ui/ScreenShell';

const flowerFilters = ['전체', ...flowerLabels];

const spotCoordinates: Record<FlowerSpot['id'], { latitude: number; longitude: number }> = {
  'everland-tulip-garden': { latitude: 37.2944, longitude: 127.2023 },
  'jeju-noksan-ro': { latitude: 33.4342, longitude: 126.6735 },
  'namsan-azalea-trail': { latitude: 37.5512, longitude: 126.9882 },
  'yeouido-yunjung-ro': { latitude: 37.5288, longitude: 126.9291 },
};

const defaultCamera = {
  latitude: 37.534,
  longitude: 126.978,
  zoom: 9.6,
};

type NativeMapCanvasProps = {
  spots: FlowerSpot[];
  selectedSpotId: string;
  onSelectSpot: (spotId: string) => void;
};

function NativeMapCanvas({ spots, selectedSpotId, onSelectSpot }: NativeMapCanvasProps) {
  const { NaverMapMarkerOverlay, NaverMapPathOverlay, NaverMapView } =
    require('@mj-studio/react-native-naver-map') as typeof import('@mj-studio/react-native-naver-map');

  const selectedSpot = spots.find((spot) => spot.id === selectedSpotId) ?? spots[0];
  const selectedCoordinate = selectedSpot ? spotCoordinates[selectedSpot.id] : undefined;
  const routeCoords = spots.map((spot) => spotCoordinates[spot.id]);

  return (
    <NaverMapView
      animationDuration={700}
      camera={
        selectedCoordinate
          ? {
              latitude: selectedCoordinate.latitude,
              longitude: selectedCoordinate.longitude,
              zoom: selectedSpot.flower === '유채꽃' ? 8.6 : 10.4,
            }
          : defaultCamera
      }
      isExtentBoundedInKorea
      isShowCompass={false}
      isShowIndoorLevelPicker={false}
      isShowLocationButton={false}
      isShowScaleBar={false}
      isShowZoomControls={false}
      locale="ko"
      logoMargin={{ bottom: 18, left: 18 }}
      mapPadding={{ bottom: 24, left: 24, right: 24, top: 112 }}
      style={StyleSheet.absoluteFill}
    >
      {routeCoords.length > 1 ? (
        <NaverMapPathOverlay color="#F58FA9" coords={routeCoords} outlineColor="#FFFFFF" outlineWidth={2} width={6} />
      ) : null}
      {spots.map((spot) => {
        const coordinate = spotCoordinates[spot.id];
        const isSelected = spot.id === selectedSpotId;

        return (
          <NaverMapMarkerOverlay
            key={spot.id}
            caption={{ text: spot.place }}
            height={isSelected ? 40 : 34}
            image={{ symbol: isSelected ? 'pink' : 'green' }}
            isForceShowIcon={isSelected}
            latitude={coordinate.latitude}
            longitude={coordinate.longitude}
            onTap={() => onSelectSpot(spot.id)}
            width={isSelected ? 32 : 28}
          />
        );
      })}
    </NaverMapView>
  );
}

function WebMapFallback() {
  return (
    <>
      <View style={styles.mapGlowPink} />
      <View style={styles.mapGlowYellow} />
      <View style={styles.mapPathHorizontal} />
      <View style={styles.mapPathVertical} />
      <View style={[styles.marker, styles.markerPink, { left: '20%', top: '28%' }]} />
      <View style={[styles.marker, styles.markerYellow, { left: '68%', top: '30%' }]} />
      <View style={[styles.marker, styles.markerGreen, { left: '44%', top: '58%' }]} />
    </>
  );
}

export function MapScreen() {
  const router = useRouter();
  const [selectedFlower, setSelectedFlower] = useState('전체');
  const [selectedSpotId, setSelectedSpotId] = useState(featuredSpots[0]?.id ?? '');

  const visibleSpots = selectedFlower === '전체' ? featuredSpots : featuredSpots.filter((spot) => spot.flower === selectedFlower);
  const selectedSpot = visibleSpots.find((spot) => spot.id === selectedSpotId) ?? visibleSpots[0] ?? featuredSpots[0];

  useEffect(() => {
    if (!visibleSpots.some((spot) => spot.id === selectedSpotId) && visibleSpots[0]) {
      setSelectedSpotId(visibleSpots[0].id);
    }
  }, [selectedSpotId, visibleSpots]);

  return (
    <ScreenShell title="지도 탐색" subtitle="지금 갈 만한 꽃 명소를 지도와 리스트 흐름으로 바로 비교해보세요.">
      <View style={styles.topBar}>
        <Pressable style={styles.locationButton}>
          <Text style={styles.locationButtonText}>대한민국</Text>
        </Pressable>
        <View style={styles.topActions}>
          <Pressable onPress={() => router.push('/filters')} style={styles.topActionGhost}>
            <Text style={styles.topActionGhostText}>필터</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/list')} style={styles.topActionSolid}>
            <Text style={styles.topActionSolidText}>리스트</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.mapFrame}>
        {Platform.OS === 'web' ? (
          <WebMapFallback />
        ) : (
          <NativeMapCanvas onSelectSpot={setSelectedSpotId} selectedSpotId={selectedSpot.id} spots={visibleSpots} />
        )}

        <View pointerEvents="box-none" style={styles.mapFloatingLayer}>
          <View style={styles.mapOverlay}>
            <Text style={styles.mapOverlayTitle}>{selectedSpot.place}</Text>
            <Text style={styles.mapOverlayCopy}>{selectedSpot.helper}</Text>
          </View>
          <Pressable onPress={() => router.push(`/spot/${selectedSpot.id}`)} style={styles.floatingAction}>
            <Text style={styles.floatingActionText}>상세</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.chipsRow}>
        {flowerFilters.map((flower) => {
          const isActive = selectedFlower === flower;

          return (
            <Pressable
              key={flower}
              onPress={() => setSelectedFlower(flower)}
              style={[styles.flowerChip, isActive ? styles.flowerChipActive : null]}
            >
              <Text style={[styles.flowerChipText, isActive ? styles.flowerChipTextActive : null]}>{flower}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.summaryPanel}>
        {spotImages[selectedSpot.id] ? (
          <ImageBackground imageStyle={styles.summaryImageInner} source={spotImages[selectedSpot.id]} style={styles.summaryImage}>
            <View style={styles.summaryImageShade} />
          </ImageBackground>
        ) : (
          <View style={styles.summaryArt}>
            <BloomArt size="md" tone="pink" />
          </View>
        )}
        <View style={styles.summaryBody}>
          <View style={styles.summaryBadge}>
            <Text style={styles.summaryBadgeText}>{selectedSpot.badge}</Text>
          </View>
          <Text style={styles.summaryTitle}>{selectedSpot.place}</Text>
          <Text style={styles.summaryMeta}>
            {selectedSpot.flower} · {selectedSpot.location}
          </Text>
          <Text style={styles.summaryCopy}>{selectedSpot.description}</Text>
          <View style={styles.summaryActions}>
            <Pressable onPress={() => router.push(`/spot/${selectedSpot.id}`)} style={styles.summaryGhostButton}>
              <Text style={styles.summaryGhostButtonText}>상세 보기</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/list')} style={styles.summarySolidButton}>
              <Text style={styles.summarySolidButtonText}>이 주변 더 보기</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  floatingAction: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    bottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    position: 'absolute',
    right: 16,
  },
  floatingActionText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  flowerChip: {
    backgroundColor: colors.cardAlt,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  flowerChipActive: {
    backgroundColor: colors.primary,
  },
  flowerChipText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  flowerChipTextActive: {
    color: '#FFFFFF',
  },
  locationButton: {
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  locationButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  mapFloatingLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  mapFrame: {
    backgroundColor: '#E7EFE2',
    borderRadius: 34,
    height: 340,
    marginBottom: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  mapGlowPink: {
    backgroundColor: '#FAD6DE',
    borderRadius: 999,
    height: 150,
    opacity: 0.7,
    position: 'absolute',
    right: -24,
    top: -30,
    width: 150,
  },
  mapGlowYellow: {
    backgroundColor: '#F8E8A9',
    borderRadius: 999,
    bottom: -28,
    height: 120,
    left: -10,
    opacity: 0.8,
    position: 'absolute',
    width: 120,
  },
  mapOverlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: 24,
    left: 16,
    padding: 14,
    position: 'absolute',
    top: 16,
    width: 220,
  },
  mapOverlayCopy: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  mapOverlayTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  mapPathHorizontal: {
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 999,
    height: 10,
    left: 30,
    position: 'absolute',
    top: 160,
    width: 240,
  },
  mapPathVertical: {
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderRadius: 999,
    height: 210,
    left: 164,
    position: 'absolute',
    top: 60,
    width: 10,
  },
  marker: {
    borderColor: '#FFFFFF',
    borderRadius: 999,
    borderWidth: 4,
    height: 22,
    position: 'absolute',
    width: 22,
  },
  markerGreen: {
    backgroundColor: colors.primary,
  },
  markerPink: {
    backgroundColor: colors.secondary,
  },
  markerYellow: {
    backgroundColor: colors.warning,
  },
  summaryActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  summaryArt: {
    alignItems: 'center',
    backgroundColor: colors.cardRose,
    justifyContent: 'center',
    minHeight: 160,
  },
  summaryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: 999,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  summaryBadgeText: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '700',
  },
  summaryBody: {
    padding: 18,
  },
  summaryCopy: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  summaryGhostButton: {
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  summaryGhostButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  summaryImage: {
    height: 156,
    width: '100%',
  },
  summaryImageInner: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  summaryImageShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  summaryMeta: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
  summaryPanel: {
    backgroundColor: colors.cardRose,
    borderColor: '#F2D4DA',
    borderRadius: 30,
    borderWidth: 1,
    overflow: 'hidden',
  },
  summarySolidButton: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  summarySolidButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  summaryTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  topActions: {
    flexDirection: 'row',
    gap: 8,
  },
  topActionGhost: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  topActionGhostText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  topActionSolid: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  topActionSolidText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
});
