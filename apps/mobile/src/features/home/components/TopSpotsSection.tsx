import { useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { getTopSpots, spotKeys } from '../../../shared/data/spotRepository';
import type { FlowerSpot } from '../../../shared/data/types';
import { colors } from '../../../shared/theme/colors';
import { NowScoreBadges } from '../../../shared/ui/NowScoreBadges';
import { SkeletonBox } from '../../../shared/ui/SkeletonBox';

const TOP_COUNT = 10;

export function TopSpotsSection() {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: spotKeys.top(TOP_COUNT),
    queryFn: () => getTopSpots(TOP_COUNT),
  });

  if (isLoading) {
    return (
      <View testID="top-spots-section" style={styles.container}>
        <SectionHeading />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.card}>
              <SkeletonBox testID="top-spots-skeleton" height={120} borderRadius={16} />
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  const spots = data ?? [];
  if (spots.length === 0) {
    return null;
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
      <Text style={styles.title}>오늘의 TOP 10</Text>
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
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
});
