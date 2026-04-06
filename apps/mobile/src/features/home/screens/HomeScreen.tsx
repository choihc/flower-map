import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { AppState, type AppStateStatus, Dimensions, ImageBackground, Linking, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import {
  deriveFlowerLabels,
  deriveRegionSummaries,
  getPublishedSpots,
  spotKeys,
} from '../../../shared/data/spotRepository';
import {
  type Coords,
  formatDistance,
  getNearbySpots,
  requestAndGetLocation,
} from '../../../shared/lib/location';
import { resolveSpotImage } from '../../../shared/lib/resolveSpotImage';
import { colors } from '../../../shared/theme/colors';
import { BloomArt } from '../../../shared/ui/BloomArt';
import { ScreenShell } from '../../../shared/ui/ScreenShell';
import { SpotHeroCard } from '../../../shared/ui/SpotHeroCard';
import { NativeSpotAd } from '../../../shared/ui/NativeSpotAd';
import { SkeletonBox } from '../../../shared/ui/SkeletonBox';

export function HomeScreen() {
  const router = useRouter();
  const { data: featuredSpots = [], isLoading, error } = useQuery({
    queryKey: spotKeys.all,
    queryFn: getPublishedSpots,
  });
  if (error) console.error('[HomeScreen] spots query error:', error);
  const flowerLabels = deriveFlowerLabels(featuredSpots);
  const regionSummaries = deriveRegionSummaries(featuredSpots);
  const [selectedFlower, setSelectedFlower] = useState<string>('전체');

  type LocationState = 'idle' | 'loading' | 'granted' | 'denied';
  const [locationState, setLocationState] = useState<LocationState>('idle');
  const [userCoords, setUserCoords] = useState<Coords | null>(null);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);

  // 데이터 로드 시 한 번만 셔플 (위치 없을 때 랜덤 노출용)
  const shuffledSpots = useMemo(
    () => [...featuredSpots].sort(() => Math.random() - 0.5),
    [featuredSpots],
  );

  const screenWidth = Dimensions.get('window').width;

  const onHeroScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
      setActiveHeroIndex(index);
    },
    [screenWidth],
  );

  const locationStateRef = useRef<LocationState>('idle');
  useEffect(() => {
    locationStateRef.current = locationState;
  }, [locationState]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active' && locationStateRef.current === 'denied') {
        setLocationState('idle');
      }
    });
    return () => sub.remove();
  }, []);

  if (isLoading) {
    return (
      <ScreenShell title="꽃 어디">
        <SkeletonBox height={390} borderRadius={34} />
        <SkeletonBox height={60} borderRadius={28} />
        <SkeletonBox height={60} borderRadius={28} />
        <SkeletonBox height={220} borderRadius={28} />
        <SkeletonBox height={220} borderRadius={28} />
      </ScreenShell>
    );
  }

  if (featuredSpots.length === 0) {
    return (
      <ScreenShell title="꽃 어디" subtitle="현재 등록된 명소가 없습니다.">
        <View style={{ alignItems: 'center', paddingTop: 60 }}>
          <BloomArt size="md" tone="pink" />
          <Text style={{ color: colors.textMuted, fontSize: 16, marginTop: 20 }}>
            곧 새로운 명소가 등록될 예정이에요
          </Text>
        </View>
      </ScreenShell>
    );
  }

  const selectedSpot =
    selectedFlower === '전체'
      ? featuredSpots[0]
      : (featuredSpots.find((spot) => spot.flower === selectedFlower) ?? featuredSpots[0]);
  const orderedSpots =
    selectedFlower === '전체'
      ? featuredSpots
      : [
          ...featuredSpots.filter((spot) => spot.flower === selectedFlower),
          ...featuredSpots.filter((spot) => spot.flower !== selectedFlower),
        ];

  // 히어로 영역: 꽃 선택과 무관하게 오늘 개화 중인 명소 5곳 랜덤 노출
  const heroSpots = shuffledSpots.filter((s) => s.bloomStatus !== '개화 종료').slice(0, 5);

  const nearbySpots = userCoords ? getNearbySpots(featuredSpots, userCoords) : [];

  // 지금 보기 좋은 명소: 위치 있으면 거리순, 없으면 랜덤 (선택 꽃 우선, 개화 종료 제외)
  const sectionSpots = (() => {
    if (userCoords) {
      const byDistance = getNearbySpots(featuredSpots, userCoords, featuredSpots.length)
        .map(({ spot }) => spot)
        .filter((s) => s.bloomStatus !== '개화 종료');
      if (selectedFlower === '전체') return byDistance.slice(0, 5);
      return [
        ...byDistance.filter((s) => s.flower === selectedFlower),
        ...byDistance.filter((s) => s.flower !== selectedFlower),
      ].slice(0, 5);
    }
    const activeSpots = shuffledSpots.filter((s) => s.bloomStatus !== '개화 종료');
    if (selectedFlower === '전체') return activeSpots.slice(0, 5);
    return [
      ...activeSpots.filter((s) => s.flower === selectedFlower),
      ...activeSpots.filter((s) => s.flower !== selectedFlower),
    ].slice(0, 5);
  })();

  const handleLocationPress = async () => {
    if (locationState === 'loading') return;
    setLocationState('loading');
    const result = await requestAndGetLocation();
    if (result === 'denied') {
      setLocationState('denied');
    } else if (result === null) {
      setLocationState('idle');
    } else {
      setUserCoords(result);
      setLocationState('granted');
    }
  };

  const endingSoonSpot =
    [...featuredSpots]
      .filter((spot) => spot.eventEndsIn)
      .sort((left, right) => getCountdownValue(left.eventEndsIn) - getCountdownValue(right.eventEndsIn))[0] ??
    featuredSpots[0];

  return (
    <ScreenShell title="꽃 어디" titleColor="#C4778A">
      <View style={styles.heroCarouselWrapper}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          onMomentumScrollEnd={onHeroScroll}
          style={styles.heroCarousel}
        >
          {heroSpots.map((spot) => (
            <View key={spot.id} style={{ width: screenWidth, paddingHorizontal: 20 }}>
              <SpotHeroCard
                badge={spot.badge}
                description={spot.description}
                imageSource={resolveSpotImage(spot) ?? undefined}
                infoPills={[spot.bloomStatus, spot.eventEndsIn ?? '상시 운영']}
                metaRight={`${spot.flower} · ${spot.location}`}
                title={spot.place}
                tone={spot.tone}
                secondaryButton={{ label: '상세 보기', onPress: () => router.push(`/spot/${spot.slug}`) }}
                primaryButton={{ label: '위치보기', onPress: () => router.push({ pathname: '/map', params: { spotSlug: spot.slug } }) }}
              />
            </View>
          ))}
        </ScrollView>
        {heroSpots.length > 1 && (
          <View style={styles.heroDots}>
            {heroSpots.map((spot, i) => (
              <View
                key={spot.id}
                style={[styles.heroDot, i === activeHeroIndex && styles.heroDotActive]}
              />
            ))}
          </View>
        )}
      </View>

      {locationState === 'granted' && nearbySpots.length > 0 ? (
        <>
          <SectionHeading meta="현재 위치 기준" title="내 주변 명소" />
          <View style={styles.nearbyList}>
            {nearbySpots.map(({ spot: nearby, distanceKm }) => (
              <Pressable
                key={nearby.id}
                onPress={() => router.push(`/spot/${nearby.slug}`)}
                style={styles.nearbyRow}
              >
                <View style={styles.nearbyInfo}>
                  <Text style={styles.nearbyTitle}>{nearby.place}</Text>
                  <Text style={styles.nearbyMeta}>
                    {nearby.flower} · {nearby.location}
                  </Text>
                </View>
                <Text style={styles.nearbyDistance}>{formatDistance(distanceKm)}</Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : locationState === 'granted' ? (
        null
      ) : locationState === 'denied' ? (
        <View style={styles.locationDenied}>
          <Text style={styles.locationDeniedText}>
            위치 권한을 허용하면 주변 명소를 볼 수 있어요.
          </Text>
          <Pressable onPress={() => Linking.openSettings()} style={styles.locationSettingsButton}>
            <Text style={styles.locationSettingsButtonText}>설정에서 허용하기</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          disabled={locationState === 'loading'}
          onPress={handleLocationPress}
          style={[
            styles.locationButton,
            locationState === 'loading' ? styles.locationButtonDisabled : null,
          ]}
        >
          <Text style={styles.locationButtonText}>
            {locationState === 'loading' ? '위치 확인 중...' : '📍 내 주변 명소 보기'}
          </Text>
        </Pressable>
      )}

      <SectionHeading title="꽃 종류 선택" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.flowerCarousel}
        style={styles.flowerCarouselWrapper}
      >
        {['전체', ...flowerLabels].map((item) => {
          const isActive = item === selectedFlower;

          return (
            <Pressable
              key={item}
              onPress={() => setSelectedFlower(item)}
              style={[
                styles.flowerTile,
                isActive ? styles.flowerTileActive : null,
              ]}
            >
              <Text style={[styles.flowerTileText, isActive ? styles.flowerTileTextActive : null]}>{item}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <SectionHeading
        meta={userCoords ? '가까운 순서로 보여요' : '랜덤 순서로 보여요'}
        title="지금 보기 좋은 명소"
      />
      <View style={styles.spotStack}>
        {sectionSpots.map((pick, index) => (
          <View key={pick.id}>
            <SpotPreview
              badge={pick.badge}
              flower={pick.flower}
              helper={pick.helper}
              imageSource={resolveSpotImage(pick) ?? undefined}
              isFeatured={pick.id === selectedSpot.id}
              place={pick.place}
              tone={pick.tone}
              onDirectionsPress={() => router.push({ pathname: '/map', params: { spotSlug: pick.slug } })}
              onPress={() => router.push(`/spot/${pick.slug}`)}
              onViewMapPress={() => router.push(`/spot/${pick.slug}`)}
            />
            {(index + 1) % 3 === 0 && index < sectionSpots.length - 1 && <NativeSpotAd />}
          </View>
        ))}
      </View>
      {orderedSpots.length > 5 && (
        <Pressable onPress={() => router.push('/(tabs)/search')} style={styles.viewAllButton}>
          <Text style={styles.viewAllButtonText}>전체 명소 보기 ({orderedSpots.length}곳)</Text>
        </Pressable>
      )}

      <SectionHeading meta="종료된 일정은 제외해 보여드려요" title="곧 끝나는 축제" />
      <View style={styles.eventCard}>
        <ImageBackground
          imageStyle={styles.eventImageInner}
          source={resolveSpotImage(endingSoonSpot) ?? undefined}
          style={styles.eventImage}
        >
          <View style={styles.eventImageShade} />
        </ImageBackground>
        <View style={styles.eventContent}>
          <View style={styles.eventBadge}>
            <Text style={styles.eventBadgeText}>{endingSoonSpot.eventEndsIn ?? '진행 중'}</Text>
          </View>
          <Text style={styles.eventTitle}>{endingSoonSpot.place}</Text>
          <Text style={styles.caption}>
            {endingSoonSpot.festivalDate} · {endingSoonSpot.location}
          </Text>
          <Text style={styles.eventDescription}>{endingSoonSpot.helper}</Text>
          <Pressable onPress={() => router.push(`/spot/${endingSoonSpot.slug}`)} style={styles.eventAction}>
            <Text style={styles.eventActionText}>행사 자세히 보기</Text>
          </Pressable>
        </View>
      </View>

      <NativeSpotAd />

      <SectionHeading meta="주말 나들이 큐레이션" title="지역별 추천" />
      <View style={styles.regionGrid}>
        {regionSummaries.map((item, index) => (
          <Pressable
            key={item}
            onPress={() => router.push({ pathname: '/(tabs)/search', params: { query: item } })}
            style={[styles.regionTile, index % 2 === 0 ? styles.regionTileTall : null]}
          >
            <Text style={styles.regionTitle}>{item}</Text>
            <Text style={styles.regionHelper}>지금 인기 명소 보기</Text>
          </Pressable>
        ))}
      </View>
    </ScreenShell>
  );
}

function getCountdownValue(value?: string) {
  if (!value) {
    return Number.MAX_SAFE_INTEGER;
  }

  const match = value.match(/\d+/);
  return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
}

function SectionHeading({ meta, title }: { meta?: string; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {meta && <Text style={styles.sectionMeta}>{meta}</Text>}
    </View>
  );
}

function SpotPreview({
  badge,
  flower,
  helper,
  imageSource,
  isFeatured,
  onDirectionsPress,
  onPress,
  onViewMapPress,
  place,
  tone,
}: {
  badge: string;
  flower: string;
  helper: string;
  imageSource?: { uri: string } | number;
  isFeatured: boolean;
  onDirectionsPress: () => void;
  onPress: () => void;
  onViewMapPress: () => void;
  place: string;
  tone: 'green' | 'pink' | 'yellow';
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.spotCard,
        tone === 'pink'
          ? styles.spotCardPink
          : tone === 'yellow'
            ? styles.spotCardYellow
            : styles.spotCardGreen,
        isFeatured ? styles.spotCardFeatured : null,
      ]}
    >
      {imageSource ? (
        <ImageBackground imageStyle={styles.spotImageInner} source={imageSource} style={styles.spotImage}>
          <View style={styles.spotImageShade} />
          <View style={styles.spotImageBadge}>
            <Text style={styles.spotImageBadgeText}>{flower}</Text>
          </View>
        </ImageBackground>
      ) : (
        <View style={styles.spotArt}>
          <BloomArt size="md" tone={tone} />
        </View>
      )}
      <View style={styles.spotContent}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
        <Text style={styles.spotTitle}>{place}</Text>
        <Text style={styles.caption}>{helper}</Text>
        <View style={styles.buttonRow}>
          <Pressable onPress={onViewMapPress} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>상세 보기</Text>
          </Pressable>
          <Pressable onPress={onDirectionsPress} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>위치보기</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  heroCarouselWrapper: {
    marginHorizontal: -20,
    marginBottom: 2,
  },
  heroCarousel: {},
  heroDots: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginBottom: 10,
  },
  heroDot: {
    backgroundColor: colors.border,
    borderRadius: 999,
    height: 7,
    width: 7,
  },
  heroDotActive: {
    backgroundColor: colors.primary,
    width: 18,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: 999,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    color: colors.secondaryDeep,
    fontSize: 12,
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  caption: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  eventAction: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: 999,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  eventActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  eventBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.softYellow,
    borderRadius: 999,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  eventBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  eventCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 30,
    borderWidth: 1,
    marginBottom: 34,
    overflow: 'hidden',
    shadowColor: '#BDAF9F',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.08,
    shadowRadius: 24,
  },
  eventContent: {
    padding: 18,
  },
  eventDescription: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  eventImage: {
    height: 180,
    width: '100%',
  },
  eventImageInner: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  eventImageShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  eventTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  flowerCarousel: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  flowerCarouselWrapper: {
    marginBottom: 24,
    marginHorizontal: -20,
  },
  flowerTile: {
    alignItems: 'center',
    backgroundColor: colors.cardAlt,
    borderColor: 'transparent',
    borderRadius: 999,
    borderWidth: 1.5,
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  flowerTileActive: {
    backgroundColor: colors.primary,
    borderColor: 'transparent',
  },
  flowerTileText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  flowerTileTextActive: {
    color: '#FFFFFF',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 999,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  regionArt: {
    marginBottom: 12,
  },
  regionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  regionHelper: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 6,
  },
  regionTile: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 10,
    padding: 16,
    width: '48%',
  },
  regionTileTall: {},
  regionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  sectionHeader: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionMeta: {
    color: colors.textMuted,
    fontSize: 13,
    marginLeft: 18,
    textAlign: 'right',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  spotArt: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    minHeight: 180,
    width: '100%',
  },
  spotCard: {
    borderRadius: 28,
    marginBottom: 14,
    overflow: 'hidden',
  },
  spotCardFeatured: {
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.12,
    shadowRadius: 20,
  },
  spotCardGreen: {
    backgroundColor: colors.surfaceGreen,
  },
  spotCardPink: {
    backgroundColor: colors.surfaceRose,
  },
  spotCardYellow: {
    backgroundColor: colors.cardSun,
  },
  spotContent: {
    padding: 18,
  },
  spotImage: {
    height: 190,
    width: '100%',
  },
  spotImageBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderRadius: 999,
    left: 14,
    paddingHorizontal: 11,
    paddingVertical: 6,
    position: 'absolute',
    top: 14,
  },
  spotImageBadgeText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  spotImageInner: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  spotImageShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  spotStack: {
    marginBottom: 14,
  },
  viewAllButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 28,
    paddingVertical: 14,
  },
  viewAllButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  spotTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  locationButton: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 20,
    paddingVertical: 14,
  },
  locationButtonDisabled: {
    opacity: 0.5,
  },
  locationButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  locationDenied: {
    backgroundColor: colors.cardAlt,
    borderRadius: 20,
    marginBottom: 20,
    padding: 16,
  },
  locationDeniedText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  locationSettingsButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  locationSettingsButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  nearbyDistance: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  nearbyInfo: {
    flex: 1,
  },
  nearbyList: {
    marginBottom: 20,
  },
  nearbyMeta: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 3,
  },
  nearbyRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  nearbyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
});
