// src/shared/ui/SearchResultCard.tsx
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { FlowerSpot } from '../data/types';
import { colors } from '../theme/colors';
import { BloomArt } from './BloomArt';

export type SearchResultCardProps = {
  spot: FlowerSpot;
  onPress: () => void;
};

function badgeStyle(bloomStatus: string) {
  // spotMappers.ts의 toBloomStatus()가 반환하는 값과 정확히 일치해야 함
  if (bloomStatus === '개화 종료') {
    return { bg: '#EDE8E4', text: '#8C7060' };
  }
  if (bloomStatus === '개화 예정') {
    return { bg: colors.softYellow, text: colors.text };
  }
  // '개화 중', '지금 보기 좋아요' 모두 이 케이스
  return { bg: colors.surfaceGreen, text: colors.primary };
}

// tone은 'pink' | 'yellow' | 'green' 3가지만 존재 (FlowerSpotTone)
function thumbnailBg(tone: FlowerSpot['tone']) {
  if (tone === 'pink') return colors.surfaceRose;
  if (tone === 'yellow') return colors.cardSun;
  return colors.surfaceGreen; // 'green'
}

export function SearchResultCard({ spot, onPress }: SearchResultCardProps) {
  const imageUri = spot.thumbnailUrl ?? spot.flowerThumbnailUrl;
  const badge = badgeStyle(spot.bloomStatus);

  return (
    <Pressable onPress={onPress} style={styles.card}>
      {imageUri ? (
        <Image
          testID="spot-thumbnail-image"
          source={{ uri: imageUri }}
          style={styles.thumbnail}
        />
      ) : (
        <View style={[styles.thumbnail, styles.thumbnailFallback, { backgroundColor: thumbnailBg(spot.tone) }]}>
          <BloomArt size="sm" tone={spot.tone} />
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.place} numberOfLines={1}>{spot.place}</Text>
        <Text style={styles.meta} numberOfLines={1}>{spot.flower} · {spot.location}</Text>
        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.badgeText, { color: badge.text }]}>{spot.bloomStatus}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  card: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
    padding: 12,
  },
  info: {
    flex: 1,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  place: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  thumbnail: {
    borderRadius: 12,
    height: 64,
    width: 64,
  },
  thumbnailFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
