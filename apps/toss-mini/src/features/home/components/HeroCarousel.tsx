import { Badge } from '@toss/tds-react-native';
import React from 'react';
import { Dimensions, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { FlowerSpot } from '@flower-map/flower-domain';

import { BloomArt } from '../../../shared/components/BloomArt';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_MARGIN = 20;

type HeroCarouselProps = {
  spots: FlowerSpot[];
  onPress: (spot: FlowerSpot) => void;
};

const TONE_BG: Record<string, string> = {
  pink: '#FBE8F0',
  yellow: '#FBF0C0',
  green: '#E8F5E9',
};

function SpotImage({ spot }: { spot: FlowerSpot }) {
  const uri = spot.thumbnailUrl ?? spot.flowerThumbnailUrl;
  if (uri) {
    return <Image source={{ uri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />;
  }
  return (
    <View
      style={[
        StyleSheet.absoluteFillObject,
        { backgroundColor: TONE_BG[spot.tone] ?? '#FBE8F0', alignItems: 'center', justifyContent: 'center' },
      ]}
    >
      <BloomArt size="lg" tone={spot.tone} />
    </View>
  );
}

export function HeroCarousel({ spots, onPress }: HeroCarouselProps) {
  if (spots.length === 0) return null;

  return (
    <ScrollView
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
    >
      {spots.map((spot) => (
        <View key={spot.id} style={styles.page}>
          <Pressable style={styles.card} onPress={() => onPress(spot)}>
            <SpotImage spot={spot} />
            <View style={styles.overlay}>
              <Badge size="small" type="red" badgeStyle="fill">{spot.badge}</Badge>
              <Text style={styles.place}>{spot.place}</Text>
              <Text style={styles.flower}>{spot.flower} · {spot.location}</Text>
            </View>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    width: SCREEN_WIDTH,
    paddingHorizontal: CARD_MARGIN,
  },
  card: {
    width: SCREEN_WIDTH - CARD_MARGIN * 2,
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FBE8F0',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.28)',
    padding: 16,
    justifyContent: 'flex-end',
    gap: 4,
  },
  place: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  flower: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
  },
});
