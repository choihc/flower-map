import { Badge } from '@toss/tds-react-native';
import React, { useState } from 'react';
import { Dimensions, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { FlowerSpot } from '@flower-map/flower-domain';

import { SpotImage } from '../../../shared/components/SpotImage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_MARGIN = 20;

type HeroCarouselProps = {
  spots: FlowerSpot[];
  onPress: (spot: FlowerSpot) => void;
};

export function HeroCarousel({ spots, onPress }: HeroCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (spots.length === 0) return null;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(index);
  };

  return (
    <View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScroll}
      >
        {spots.map((spot) => (
          <View key={spot.id} style={styles.page}>
            <Pressable style={styles.card} onPress={() => onPress(spot)}>
              <SpotImage spot={spot} style={StyleSheet.absoluteFillObject} bloomSize="lg" />
              <View style={styles.overlay}>
                <Badge size="small" type="red" badgeStyle="fill">{spot.badge}</Badge>
                <Text style={styles.place}>{spot.place}</Text>
                <Text style={styles.flower}>{spot.flower} · {spot.location}</Text>
              </View>
            </Pressable>
          </View>
        ))}
      </ScrollView>
      <View style={styles.dots}>
        {spots.map((_, i) => (
          <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
        ))}
      </View>
    </View>
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
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F0C0D4',
  },
  dotActive: {
    width: 18,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#C45C7E',
  },
});
