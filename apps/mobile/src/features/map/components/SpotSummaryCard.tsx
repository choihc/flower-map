// apps/mobile/src/features/map/components/SpotSummaryCard.tsx
import { useRouter } from 'expo-router';
import { Dimensions, ImageBackground, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import type { FlowerSpot } from '../../../shared/data/types';
import { resolveSpotImage } from '../../../shared/lib/resolveSpotImage';
import { colors } from '../../../shared/theme/colors';
import { BloomArt } from '../../../shared/ui/BloomArt';

const CARD_WIDTH = Dimensions.get('window').width - 40;

type SpotSummaryCardProps = {
  spot: FlowerSpot;
};

export function SpotSummaryCard({ spot }: SpotSummaryCardProps) {
  const router = useRouter();
  const spotImage = resolveSpotImage(spot);

  return (
    <View style={styles.card}>
      {spotImage ? (
        <ImageBackground imageStyle={styles.imageInner} source={spotImage} style={styles.image}>
          <View style={styles.imageShade} />
        </ImageBackground>
      ) : (
        <View style={styles.artContainer}>
          <BloomArt size="md" tone="pink" />
        </View>
      )}
      <View style={styles.body}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{spot.badge}</Text>
        </View>
        <Text style={styles.title}>{spot.place}</Text>
        <Text style={styles.meta}>
          {spot.flower} · {spot.location}
        </Text>
        <Text numberOfLines={2} style={styles.description}>
          {spot.description}
        </Text>
        <View style={styles.actions}>
          <Pressable onPress={() => router.push(`/spot/${spot.slug}`)} style={styles.ghostButton}>
            <Text style={styles.ghostButtonText}>상세 보기</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              const url = `nmap://route/car?dlat=${spot.latitude}&dlng=${spot.longitude}&dname=${encodeURIComponent(spot.place)}&appname=com.kkoteodi.mobile`;
              Linking.openURL(url).catch(() =>
                Linking.openURL(
                  `https://map.naver.com/p/directions/-/-/${spot.longitude},${spot.latitude},${encodeURIComponent(spot.place)}/-/car`,
                ),
              );
            }}
            style={styles.directionsButton}
          >
            <Text style={styles.directionsButtonText}>길찾기</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  artContainer: {
    alignItems: 'center',
    backgroundColor: colors.cardRose,
    justifyContent: 'center',
    minHeight: 160,
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
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '700',
  },
  body: {
    padding: 18,
  },
  card: {
    backgroundColor: colors.cardRose,
    borderColor: '#F2D4DA',
    borderRadius: 30,
    borderWidth: 1,
    overflow: 'hidden',
    width: CARD_WIDTH,
  },
  description: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  directionsButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 999,
    flex: 1,
    paddingVertical: 11,
  },
  directionsButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  ghostButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 11,
  },
  ghostButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  image: {
    height: 156,
    width: '100%',
  },
  imageInner: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  imageShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  meta: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
});
