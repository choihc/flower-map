import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import {
  deriveFlowerLabels,
  deriveRegionSummaries,
  getPublishedSpots,
  spotKeys,
} from '../../../shared/data/spotRepository';
import { resolveSpotImage } from '../../../shared/lib/resolveSpotImage';
import { colors } from '../../../shared/theme/colors';
import { BloomArt } from '../../../shared/ui/BloomArt';
import { ScreenShell } from '../../../shared/ui/ScreenShell';
import { SkeletonBox } from '../../../shared/ui/SkeletonBox';

export function HomeScreen() {
  const router = useRouter();
  const { data: featuredSpots = [], isLoading } = useQuery({
    queryKey: spotKeys.all,
    queryFn: getPublishedSpots,
  });
  const flowerLabels = deriveFlowerLabels(featuredSpots);
  const regionSummaries = deriveRegionSummaries(featuredSpots);
  const [selectedFlower, setSelectedFlower] = useState<string | undefined>(flowerLabels[0]);

  if (isLoading) {
    return (
      <ScreenShell title="꽃 어디" subtitle="불러오는 중...">
        <SkeletonBox height={390} borderRadius={34} />
        <SkeletonBox height={60} borderRadius={28} />
        <SkeletonBox height={60} borderRadius={28} />
        <SkeletonBox height={220} borderRadius={28} />
        <SkeletonBox height={220} borderRadius={28} />
      </ScreenShell>
    );
  }

  const selectedSpot =
    featuredSpots.find((spot) => spot.flower === selectedFlower) ?? featuredSpots[0];
  const orderedSpots = [
    selectedSpot,
    ...featuredSpots.filter((spot) => spot.id !== selectedSpot.id),
  ];
  const endingSoonSpot =
    [...featuredSpots]
      .filter((spot) => spot.eventEndsIn)
      .sort((left, right) => getCountdownValue(left.eventEndsIn) - getCountdownValue(right.eventEndsIn))[0] ??
    featuredSpots[0];

  return (
    <ScreenShell title="꽃 어디" subtitle="오늘 피어 있는 곳부터 감성 있게, 빠르게 보여드릴게요.">
      <ImageBackground
        imageStyle={styles.heroImageInner}
        source={resolveSpotImage(selectedSpot) ?? undefined}
        style={styles.hero}
      >
        <View style={styles.heroShade} />
        <View style={styles.heroGlowA} />
        <View style={styles.heroGlowB} />

        <View style={styles.heroTopRow}>
          <View style={styles.heroPill}>
            <Text style={styles.heroPillText}>{selectedSpot.badge}</Text>
          </View>
          <Text style={styles.heroMeta}>
            {selectedSpot.flower} · {selectedSpot.location}
          </Text>
        </View>

        <View style={styles.heroBody}>
          <Text style={styles.heroTitle}>{selectedSpot.place}</Text>
          <Text style={styles.heroDescription}>{selectedSpot.description}</Text>

          <View style={styles.heroInfoRow}>
            <View style={styles.heroInfoPill}>
              <Text style={styles.heroInfoText}>{selectedSpot.bloomStatus}</Text>
            </View>
            <View style={styles.heroInfoPill}>
              <Text style={styles.heroInfoText}>{selectedSpot.eventEndsIn ?? '상시 운영'}</Text>
            </View>
          </View>

          <View style={styles.heroActionRow}>
            <Pressable onPress={() => router.push(`/spot/${selectedSpot.slug}`)} style={styles.heroPrimaryButton}>
              <Text style={styles.heroPrimaryButtonText}>상세 보기</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/map')} style={styles.heroSecondaryButton}>
              <Text style={styles.heroSecondaryButtonText}>지도에서 보기</Text>
            </Pressable>
          </View>
        </View>
      </ImageBackground>

      <SectionHeading meta="선택한 꽃에 맞춰 상단 추천이 바뀌어요" title="꽃 종류 선택" />
      <View style={styles.flowerGrid}>
        {flowerLabels.map((item, index) => {
          const isActive = item === selectedFlower;

          return (
            <Pressable
              key={item}
              onPress={() => setSelectedFlower(item)}
              style={[
                styles.flowerTile,
                index === 0
                  ? styles.flowerTilePink
                  : index === 1
                    ? styles.flowerTileRose
                    : index === 2
                      ? styles.flowerTilePeach
                      : styles.flowerTileYellow,
                isActive ? styles.flowerTileActive : null,
              ]}
            >
              <BloomArt size="sm" tone={index === 0 ? 'pink' : index === 3 ? 'yellow' : 'green'} />
              <Text style={styles.flowerTileText}>{item}</Text>
            </Pressable>
          );
        })}
      </View>

      <SectionHeading meta="선택한 꽃이 먼저 보여요" title="지금 보기 좋은 명소" />
      <View style={styles.spotStack}>
        {orderedSpots.map((pick) => (
          <SpotPreview
            key={pick.id}
            badge={pick.badge}
            flower={pick.flower}
            helper={pick.helper}
            imageSource={resolveSpotImage(pick) ?? undefined}
            isFeatured={pick.id === selectedSpot.id}
            place={pick.place}
            tone={pick.tone}
            onDirectionsPress={() => router.push('/map')}
            onPress={() => setSelectedFlower(pick.flower)}
            onViewMapPress={() => router.push(`/spot/${pick.slug}`)}
          />
        ))}
      </View>

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

      <SectionHeading meta="주말 나들이 큐레이션" title="지역별 추천" />
      <View style={styles.regionGrid}>
        {regionSummaries.map((item, index) => (
          <Pressable
            key={item}
            onPress={() => router.push('/map')}
            style={[styles.regionTile, index % 2 === 0 ? styles.regionTileTall : null]}
          >
            <View style={styles.regionArt}>
              <BloomArt size="sm" tone={index === 3 ? 'yellow' : index === 1 ? 'pink' : 'green'} />
            </View>
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

function SectionHeading({ meta, title }: { meta: string; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionMeta}>{meta}</Text>
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
            <Text style={styles.primaryButtonText}>길찾기</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: colors.primaryDeep,
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
    color: colors.primaryDeep,
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
  flowerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  flowerTile: {
    alignItems: 'center',
    borderColor: 'transparent',
    borderRadius: 28,
    borderWidth: 1.5,
    flexDirection: 'row',
    marginBottom: 12,
    minWidth: '48%',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  flowerTileActive: {
    borderColor: colors.primaryDeep,
    shadowColor: colors.primaryDeep,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    transform: [{ translateY: -1 }],
  },
  flowerTilePeach: {
    backgroundColor: '#FBE9DE',
  },
  flowerTilePink: {
    backgroundColor: colors.cardRose,
  },
  flowerTileRose: {
    backgroundColor: '#F4E1E8',
  },
  flowerTileText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
  },
  flowerTileYellow: {
    backgroundColor: colors.cardSun,
  },
  hero: {
    borderRadius: 34,
    marginBottom: 22,
    minHeight: 390,
    overflow: 'hidden',
    padding: 22,
    position: 'relative',
  },
  heroActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  heroBody: {
    justifyContent: 'flex-end',
    minHeight: 300,
    width: '100%',
  },
  heroDescription: {
    color: '#FFF9F3',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
    maxWidth: 300,
  },
  heroGlowA: {
    backgroundColor: 'rgba(247, 214, 216, 0.28)',
    borderRadius: 999,
    height: 160,
    position: 'absolute',
    right: -30,
    top: -14,
    width: 160,
  },
  heroGlowB: {
    backgroundColor: 'rgba(248, 234, 193, 0.18)',
    borderRadius: 999,
    bottom: -46,
    height: 124,
    position: 'absolute',
    right: 74,
    width: 124,
  },
  heroImageInner: {
    borderRadius: 34,
  },
  heroInfoPill: {
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  heroInfoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  heroInfoText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  heroMeta: {
    color: '#FFF4F6',
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 12,
    textAlign: 'right',
  },
  heroPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  heroPillText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  heroPrimaryButton: {
    backgroundColor: colors.primaryDeep,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  heroPrimaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  heroSecondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  heroSecondaryButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  heroShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(28, 22, 20, 0.32)',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.6,
    lineHeight: 40,
    marginTop: 16,
    maxWidth: 280,
  },
  heroTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 999,
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
  regionTileTall: {
    minHeight: 144,
  },
  regionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
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
    shadowColor: colors.primaryDeep,
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
    marginBottom: 18,
  },
  spotTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
});
