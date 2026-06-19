import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { getPublishedSpots, spotKeys } from '../../../shared/data/spotRepository';
import { resolveSpotImage } from '../../../shared/lib/resolveSpotImage';
import { colors } from '../../../shared/theme/colors';
import { SkeletonBox } from '../../../shared/ui/SkeletonBox';
import { SectionHeading } from './SectionHeading';

export function EndingSoonSection() {
  const router = useRouter();
  const { data: spots = [], isPending, error } = useQuery({
    queryKey: spotKeys.all,
    queryFn: getPublishedSpots,
  });

  const endingSoonSpot = useMemo(
    () =>
      [...spots]
        .filter((spot) => spot.eventEndsIn)
        .sort(
          (left, right) =>
            getCountdownValue(left.eventEndsIn) - getCountdownValue(right.eventEndsIn),
        )[0] ?? spots[0],
    [spots],
  );

  // 응답 전이면 자기 영역 스켈레톤. (FR-4)
  if (isPending) {
    return (
      <View testID="ending-soon-skeleton">
        <SectionHeading meta="종료된 일정은 제외해 보여드려요" title="곧 끝나는 축제" />
        <SkeletonBox height={180} borderRadius={30} />
      </View>
    );
  }

  // 에러는 섹션 숨김 + console.error로 관측. (FR-6)
  if (error) {
    console.error('[EndingSoonSection] spots query error:', error);
    return null;
  }

  // 표시할 명소가 없으면 섹션을 숨긴다. (FR-5)
  if (!endingSoonSpot) return null;

  return (
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
          <Pressable
            onPress={() => router.push(`/spot/${endingSoonSpot.slug}`)}
            style={styles.eventAction}
          >
            <Text style={styles.eventActionText}>행사 자세히 보기</Text>
          </Pressable>
        </View>
      </View>
    </>
  );
}

function getCountdownValue(value?: string) {
  if (!value) {
    return Number.MAX_SAFE_INTEGER;
  }

  const match = value.match(/\d+/);
  return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
}

const styles = StyleSheet.create({
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
});
