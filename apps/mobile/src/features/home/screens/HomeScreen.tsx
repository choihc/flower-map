import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import {
  getActiveHomeCurationSlots,
  homeCurationKeys,
} from '../../../shared/data/homeCurationRepository';
import {
  deriveRegionSummaries,
  getPublishedSpots,
  spotKeys,
} from '../../../shared/data/spotRepository';
import { resolveSpotImage } from '../../../shared/lib/resolveSpotImage';
import { colors } from '../../../shared/theme/colors';
import { ScreenShell } from '../../../shared/ui/ScreenShell';
import { NativeSpotAd } from '../../../shared/ui/NativeSpotAd';
import { SeasonCurationSlot } from '../components/SeasonCurationSlot';
import { TopSpotsSection } from '../components/TopSpotsSection';
import { HocanceTop5Section } from '../components/HocanceTop5Section';

const HOME_STATIC_STALE_MS = 1000 * 60 * 30;

export function HomeScreen() {
  const router = useRouter();
  const { data: featuredSpots = [], error } = useQuery({
    queryKey: spotKeys.all,
    queryFn: getPublishedSpots,
  });
  if (error) console.error('[HomeScreen] spots query error:', error);

  const {
    data: curationSlotsRaw = [],
    error: curationError,
  } = useQuery({
    queryKey: homeCurationKeys.active,
    queryFn: getActiveHomeCurationSlots,
    staleTime: HOME_STATIC_STALE_MS,
  });
  if (curationError) console.error('[HomeScreen] curation query error:', curationError);

  const curationSlots = curationSlotsRaw.filter(
    (slot) => slot.title.trim().length > 0 && slot.ctaLabel.trim().length > 0,
  );

  const regionSummaries = useMemo(() => deriveRegionSummaries(featuredSpots), [featuredSpots]);

  const endingSoonSpot = useMemo(
    () =>
      [...featuredSpots]
        .filter((spot) => spot.eventEndsIn)
        .sort(
          (left, right) =>
            getCountdownValue(left.eventEndsIn) - getCountdownValue(right.eventEndsIn),
        )[0] ?? featuredSpots[0],
    [featuredSpots],
  );

  return (
    <ScreenShell>
      {curationSlots.length > 0 ? (
        <View style={styles.curationSection}>
          {curationSlots.map((slot) => (
            <SeasonCurationSlot key={slot.id} slot={slot} />
          ))}
        </View>
      ) : null}

      <TopSpotsSection />

      <HocanceTop5Section />

      {endingSoonSpot ? (
        <>
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
        </>
      ) : null}

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

const styles = StyleSheet.create({
  curationSection: {
    marginBottom: 4,
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
});
