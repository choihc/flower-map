import { useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { getTopSpotsWithBoost, spotKeys } from '../../../shared/data/spotRepository';
import type { FlowerSpot } from '../../../shared/data/types';
import { colors } from '../../../shared/theme/colors';
import { NowScoreBadges } from '../../../shared/ui/NowScoreBadges';
import { SkeletonBox } from '../../../shared/ui/SkeletonBox';

const TOP_COUNT = 10;

export function TopSpotsSection() {
  const router = useRouter();
  const { data, isLoading, error } = useQuery({
    queryKey: spotKeys.topBoosted(TOP_COUNT),
    queryFn: () => getTopSpotsWithBoost(TOP_COUNT),
    staleTime: 1000 * 60 * 30,
  });

  if (isLoading) {
    return (
      <View testID="top-spots-section" style={styles.container}>
        <SectionHeading />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
          {[0, 1, 2].map((i) => (
            <SkeletonBox
              key={i}
              testID="top-spots-skeleton"
              width={CARD_WIDTH}
              height={CARD_SKELETON_HEIGHT}
              borderRadius={20}
              style={styles.skeletonCard}
            />
          ))}
        </ScrollView>
      </View>
    );
  }

  const spots = data ?? [];
  if (spots.length === 0) {
    return (
      <View testID="top-spots-section" style={styles.container}>
        <SectionHeading />
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            {error ? '추천을 불러오지 못했어요' : '추천 집계 준비 중'}
          </Text>
          <Text style={styles.emptyMeta}>
            잠시 후 다시 확인해주세요.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View testID="top-spots-section" style={styles.container}>
      <SectionHeading />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carousel}
      >
        {spots.map((spot) => (
          <TopSpotCard
            key={spot.id}
            spot={spot}
            onPress={() => router.push(`/spot/${spot.slug}`)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function SectionHeading() {
  return (
    <View style={styles.heading}>
      <Text style={styles.title}>꽃 명소 TOP 10</Text>
      <Text style={styles.meta}>지금 지수로 뽑은 추천</Text>
    </View>
  );
}

function TopSpotCard({ spot, onPress }: { spot: FlowerSpot; onPress: () => void }) {
  const imageUri = spot.thumbnailUrl ?? spot.flowerThumbnailUrl;

  return (
    <Pressable onPress={onPress} style={styles.card}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]} />
      )}
      <View style={styles.cardBody}>
        <Text numberOfLines={1} style={styles.place}>
          {spot.place}
        </Text>
        <Text numberOfLines={1} style={styles.meta}>
          {spot.flower} · {spot.location}
        </Text>
        <NowScoreBadges
          bloomScore={spot.bloomScore}
          trendScore={spot.trendScore}
          yoyScore={spot.yoyScore}
        />
      </View>
    </Pressable>
  );
}

const CARD_WIDTH = 220;
// 실제 카드(이미지 120 + 본문: 제목·메타·NOW 배지)의 평균 높이에 맞춰 풀카드로 채운다.
const CARD_SKELETON_HEIGHT = 200;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 12,
    overflow: 'hidden',
    width: CARD_WIDTH,
  },
  cardBody: {
    gap: 6,
    padding: 12,
  },
  carousel: {
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  container: {
    marginBottom: 24,
    marginHorizontal: -20,
  },
  emptyMeta: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  emptyText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  heading: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  image: {
    height: 120,
    width: '100%',
  },
  imagePlaceholder: {
    backgroundColor: colors.cardAlt,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
  },
  place: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  skeletonCard: {
    marginRight: 12,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
});
