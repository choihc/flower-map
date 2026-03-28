import { useCallback, useEffect, useRef, useState } from 'react';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import type { ViewToken } from 'react-native';

import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import {
  deriveFlowerLabels,
  getPublishedSpots,
  spotKeys,
} from '../../../shared/data/spotRepository';
import type { FlowerSpot } from '../../../shared/data/types';
import { colors } from '../../../shared/theme/colors';
import { ScreenShell } from '../../../shared/ui/ScreenShell';
import { SkeletonBox } from '../../../shared/ui/SkeletonBox';
import {
  type Coords,
  getNearbySpots,
  requestAndGetLocation,
} from '../../../shared/lib/location';
import { SpotSummaryCard } from '../components/SpotSummaryCard';

const defaultCamera = {
  latitude: 37.534,
  longitude: 126.978,
  zoom: 9.6,
};

const CARD_WIDTH = Dimensions.get('window').width - 40;
const CARD_GAP = 10;
const viewabilityConfig = { itemVisiblePercentThreshold: 50 };

const nativeNaverMapViewName = 'RNCNaverMapView';
const isExpoGo = Constants.appOwnership === 'expo';
const isStoreClient = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
const isNativeNaverMapAvailable =
  Platform.OS !== 'web' && UIManager.hasViewManagerConfig(nativeNaverMapViewName);

type NativeMapCanvasProps = {
  spots: FlowerSpot[];
  selectedSpotSlug: string;
  userCamera?: Coords;
  onSelectSpot: (spotSlug: string) => void;
};

function NativeMapCanvas({ spots, selectedSpotSlug, userCamera, onSelectSpot }: NativeMapCanvasProps) {
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
        userCamera
          ? { latitude: userCamera.latitude, longitude: userCamera.longitude, zoom: 11 }
          : selectedCoordinate
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
  const { spotSlug: initialSpotSlug } = useLocalSearchParams<{ spotSlug?: string }>();
  const { data: spots = [], isLoading, error } = useQuery({
    queryKey: spotKeys.all,
    queryFn: getPublishedSpots,
  });
  if (error) console.error('[MapScreen] spots query error:', error);
  const flowerLabels = deriveFlowerLabels(spots);
  const flowerFilters = ['전체', ...flowerLabels];
  const [selectedFlower, setSelectedFlower] = useState('전체');
  const [selectedSpotSlug, setSelectedSpotSlug] = useState(initialSpotSlug ?? '');
  const [userCameraCoords, setUserCameraCoords] = useState<Coords | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  const handleViewableChange = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        setSelectedSpotSlug((viewableItems[0].item as FlowerSpot).slug);
      }
    },
    [],
  );

  useEffect(() => {
    if (initialSpotSlug && spots.length > 0) {
      setSelectedSpotSlug(initialSpotSlug);
      setSelectedFlower('전체');
      const index = spots.findIndex((s) => s.slug === initialSpotSlug);
      if (index !== -1) {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({ index, animated: false });
        }, 0);
      }
    }
  }, [initialSpotSlug, spots]);

  const visibleSpots = selectedFlower === '전체' ? spots : spots.filter((spot) => spot.flower === selectedFlower);
  const selectedSpot = visibleSpots.find((spot) => spot.slug === selectedSpotSlug) ?? visibleSpots[0] ?? spots[0];

  const handleLocationPress = async () => {
    if (locationLoading) return;
    setLocationLoading(true);
    const result = await requestAndGetLocation();
    if (result !== 'denied' && result !== null) {
      setUserCameraCoords(result);
      const pool = visibleSpots.length > 0 ? visibleSpots : spots;
      const nearest = getNearbySpots(pool, result, 1)[0];
      if (nearest) {
        setSelectedSpotSlug(nearest.spot.slug);
        const index = pool.findIndex((s) => s.slug === nearest.spot.slug);
        if (index !== -1) {
          flatListRef.current?.scrollToIndex({ index, animated: true });
        }
      }
    } else {
      setUserCameraCoords(null);
    }
    setLocationLoading(false);
  };

  const handleSelectSpot = (spotSlug: string) => {
    setUserCameraCoords(null);
    setSelectedSpotSlug(spotSlug);
    const index = visibleSpots.findIndex((s) => s.slug === spotSlug);
    if (index !== -1) {
      flatListRef.current?.scrollToIndex({ index, animated: true });
    }
  };

  const handleFlowerChange = (flower: string) => {
    setSelectedFlower(flower);
    setUserCameraCoords(null);
    const newVisibleSpots = flower === '전체' ? spots : spots.filter((s) => s.flower === flower);
    const firstSlug = newVisibleSpots[0]?.slug ?? '';
    setSelectedSpotSlug(firstSlug);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  };

  if (isLoading) {
    return (
      <ScreenShell title="지도 탐색">
        <SkeletonBox height={400} borderRadius={24} />
        <SkeletonBox height={80} borderRadius={20} />
        <SkeletonBox height={80} borderRadius={20} />
      </ScreenShell>
    );
  }

  if (spots.length === 0) {
    return (
      <ScreenShell title="지도 탐색" subtitle="등록된 명소가 없습니다.">
        <View style={{ alignItems: 'center', paddingTop: 60 }}>
          <Text style={{ color: colors.textMuted, fontSize: 16, marginTop: 20 }}>
            {error ? '데이터를 불러오지 못했습니다' : '곧 새로운 명소가 등록될 예정이에요'}
          </Text>
        </View>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title="지도 탐색" subtitle="지금 갈 만한 꽃 명소를 지도와 리스트 흐름으로 바로 비교해보세요.">
      <View style={styles.mapFrame}>
        {Platform.OS === 'web' ? (
          <WebMapFallback />
        ) : !isNativeNaverMapAvailable ? (
          <NativeMapUnavailableFallback />
        ) : (
          <NativeMapCanvas
            onSelectSpot={handleSelectSpot}
            selectedSpotSlug={selectedSpot.slug}
            spots={visibleSpots}
            userCamera={userCameraCoords ?? undefined}
          />
        )}

        <View pointerEvents="box-none" style={styles.mapFloatingLayer}>
          <View style={styles.mapOverlay}>
            <Text style={styles.mapOverlayTitle}>{selectedSpot.place}</Text>
            <Text style={styles.mapOverlayCopy}>{selectedSpot.helper}</Text>
          </View>
          {Platform.OS !== 'web' && (
            <Pressable
              disabled={locationLoading}
              onPress={handleLocationPress}
              style={[
                styles.floatingLocationButton,
                locationLoading ? styles.floatingButtonDisabled : null,
              ]}
            >
              {locationLoading ? (
                <ActivityIndicator color={colors.textMuted} size="small" />
              ) : (
                <MaterialIcons color={colors.text} name="my-location" size={20} />
              )}
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        data={flowerFilters}
        horizontal
        ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
        keyExtractor={(item) => item}
        renderItem={({ item: flower }) => {
          const isActive = selectedFlower === flower;

          return (
            <Pressable
              onPress={() => handleFlowerChange(flower)}
              style={[styles.flowerChip, isActive ? styles.flowerChipActive : null]}
            >
              <Text style={[styles.flowerChipText, isActive ? styles.flowerChipTextActive : null]}>{flower}</Text>
            </Pressable>
          );
        }}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsCarousel}
        style={styles.chipsCarouselWrapper}
      />

      <View style={{ paddingHorizontal: 20 }}>
        <FlatList
          ref={flatListRef}
          data={visibleSpots}
          decelerationRate="fast"
          getItemLayout={(_data, index) => ({
            index,
            length: CARD_WIDTH + CARD_GAP,
            offset: (CARD_WIDTH + CARD_GAP) * index,
          })}
          horizontal
          ItemSeparatorComponent={() => <View style={{ width: CARD_GAP }} />}
          keyExtractor={(item) => item.slug}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: 20, width: CARD_WIDTH }}>
              <Text style={{ color: colors.textMuted }}>표시할 명소가 없습니다.</Text>
            </View>
          }
          onScrollToIndexFailed={(info) => {
            setTimeout(() => {
              flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
            }, 100);
          }}
          onViewableItemsChanged={handleViewableChange}
          renderItem={({ item }) => <SpotSummaryCard spot={item} />}
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_WIDTH + CARD_GAP}
          viewabilityConfig={viewabilityConfig}
        />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  chipsCarousel: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  floatingButtonDisabled: {
    opacity: 0.5,
  },
  floatingLocationButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    bottom: 60,
    height: 44,
    justifyContent: 'center',
    position: 'absolute',
    right: 16,
    width: 44,
  },
  chipsCarouselWrapper: {
    marginBottom: 16,
    marginHorizontal: -20,
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
  mapFloatingLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  mapFrame: {
    backgroundColor: '#EEF6EC',
    borderRadius: 34,
    height: 340,
    marginBottom: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  mapGlowPink: {
    backgroundColor: '#FCEAEE',
    borderRadius: 999,
    height: 150,
    opacity: 0.7,
    position: 'absolute',
    right: -24,
    top: -30,
    width: 150,
  },
  mapGlowYellow: {
    backgroundColor: '#FBF0C0',
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
});
