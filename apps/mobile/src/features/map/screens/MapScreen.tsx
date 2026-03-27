import { useEffect, useState } from 'react';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useRouter } from 'expo-router';
import { ImageBackground, Platform, Pressable, StyleSheet, Text, UIManager, View } from 'react-native';

import { useQuery } from '@tanstack/react-query';

import {
  deriveFlowerLabels,
  getPublishedSpots,
  spotKeys,
} from '../../../shared/data/spotRepository';
import type { FlowerSpot } from '../../../shared/data/types';
import { colors } from '../../../shared/theme/colors';
import { BloomArt } from '../../../shared/ui/BloomArt';
import { ScreenShell } from '../../../shared/ui/ScreenShell';
import { SkeletonBox } from '../../../shared/ui/SkeletonBox';

const defaultCamera = {
  latitude: 37.534,
  longitude: 126.978,
  zoom: 9.6,
};

const nativeNaverMapViewName = 'RNCNaverMapView';
const isExpoGo = Constants.appOwnership === 'expo';
const isStoreClient = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
const isNativeNaverMapAvailable =
  Platform.OS !== 'web' && UIManager.hasViewManagerConfig(nativeNaverMapViewName);

type NativeMapCanvasProps = {
  spots: FlowerSpot[];
  selectedSpotSlug: string;
  onSelectSpot: (spotSlug: string) => void;
};

function NativeMapCanvas({ spots, selectedSpotSlug, onSelectSpot }: NativeMapCanvasProps) {
  const { NaverMapMarkerOverlay, NaverMapView } =
    require('@mj-studio/react-native-naver-map') as typeof import('@mj-studio/react-native-naver-map');

  const selectedSpot = spots.find((spot) => spot.slug === selectedSpotSlug) ?? spots[0];
  const selectedCoordinate = selectedSpot
    ? {
        latitude: selectedSpot.latitude,
        longitude: selectedSpot.longitude,
      }
    : undefined;

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
      {spots.map((spot) => {
        const isSelected = spot.slug === selectedSpotSlug;

        return (
          <NaverMapMarkerOverlay
            key={spot.id}
            caption={{ text: spot.place }}
            height={isSelected ? 40 : 34}
            image={{ symbol: isSelected ? 'pink' : 'green' }}
            isForceShowIcon={isSelected}
            latitude={spot.latitude}
            longitude={spot.longitude}
            onTap={() => onSelectSpot(spot.slug)}
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
      <View style={[styles.marker, styles.markerPink, { left: '20%', top: '28%' }]} />
      <View style={[styles.marker, styles.markerYellow, { left: '68%', top: '30%' }]} />
      <View style={[styles.marker, styles.markerGreen, { left: '44%', top: '58%' }]} />
    </>
  );
}

function NativeMapUnavailableFallback() {
  const title = isExpoGo ? '개발 빌드에서 지도 확인이 필요해요' : '지도를 아직 연결하지 못했어요';
  const description = isExpoGo
    ? 'Expo Go에서는 네이버 지도 네이티브 모듈을 불러올 수 없어요. iPhone에서는 개발 빌드 앱으로 다시 열어주세요.'
    : isStoreClient
      ? '개발 빌드 앱이지만 네이버 지도 뷰가 연결되지 않았어요. 네이티브 앱을 다시 빌드한 뒤 확인해주세요.'
      : '네이버 지도 네이티브 뷰를 찾지 못했어요. iOS 앱을 다시 빌드한 뒤 확인해주세요.';

  return (
    <>
      <WebMapFallback />
      <View style={styles.mapStatusCard}>
        <Text style={styles.mapStatusEyebrow}>MAP STATUS</Text>
        <Text style={styles.mapStatusTitle}>{title}</Text>
        <Text style={styles.mapStatusCopy}>{description}</Text>
      </View>
    </>
  );
}

export function MapScreen() {
  const router = useRouter();
  const { data: spots = [], isLoading } = useQuery({
    queryKey: spotKeys.all,
    queryFn: getPublishedSpots,
  });
  const flowerLabels = deriveFlowerLabels(spots);
  const flowerFilters = ['전체', ...flowerLabels];
  const [selectedFlower, setSelectedFlower] = useState('전체');
  const [selectedSpotSlug, setSelectedSpotSlug] = useState(spots[0]?.slug ?? '');

  const visibleSpots = selectedFlower === '전체' ? spots : spots.filter((spot) => spot.flower === selectedFlower);
  const selectedSpot = visibleSpots.find((spot) => spot.slug === selectedSpotSlug) ?? visibleSpots[0] ?? spots[0];

  useEffect(() => {
    if (!visibleSpots.some((spot) => spot.slug === selectedSpotSlug) && visibleSpots[0]) {
      setSelectedSpotSlug(visibleSpots[0].slug);
    }
  }, [selectedSpotSlug, visibleSpots]);

  if (isLoading) {
    return (
      <ScreenShell title="지도" subtitle="명소를 불러오는 중...">
        <SkeletonBox height={400} borderRadius={24} />
        <SkeletonBox height={80} borderRadius={20} />
        <SkeletonBox height={80} borderRadius={20} />
      </ScreenShell>
    );
  }

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
        ) : !isNativeNaverMapAvailable ? (
          <NativeMapUnavailableFallback />
        ) : (
          <NativeMapCanvas onSelectSpot={setSelectedSpotSlug} selectedSpotSlug={selectedSpot.slug} spots={visibleSpots} />
        )}

        <View pointerEvents="box-none" style={styles.mapFloatingLayer}>
          <View style={styles.mapOverlay}>
            <Text style={styles.mapOverlayTitle}>{selectedSpot.place}</Text>
            <Text style={styles.mapOverlayCopy}>{selectedSpot.helper}</Text>
          </View>
          <Pressable onPress={() => router.push(`/spot/${selectedSpot.slug}`)} style={styles.floatingAction}>
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
        {selectedSpot.thumbnailUrl ? (
          <ImageBackground imageStyle={styles.summaryImageInner} source={{ uri: selectedSpot.thumbnailUrl }} style={styles.summaryImage}>
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
            <Pressable onPress={() => router.push(`/spot/${selectedSpot.slug}`)} style={styles.summaryGhostButton}>
              <Text style={styles.summaryGhostButtonText}>상세 보기</Text>
            </Pressable>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/list',
                  params: { flower: selectedSpot.flower },
                })
              }
              style={styles.summarySolidButton}
            >
              <Text style={styles.summarySolidButtonText}>{selectedSpot.flower} 명소 더 보기</Text>
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
  mapStatusCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 24,
    left: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    position: 'absolute',
    right: 16,
    top: 118,
  },
  mapStatusCopy: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  mapStatusEyebrow: {
    color: colors.secondaryDeep,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  mapStatusTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 6,
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
