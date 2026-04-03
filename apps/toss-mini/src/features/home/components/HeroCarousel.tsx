import { Badge, Carousel } from '@toss/tds-react-native';
import React from 'react';
import { Dimensions, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { FlowerSpot } from '@flower-map/flower-domain';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 48;

type HeroCarouselProps = {
  spots: FlowerSpot[];
  onPress: (spot: FlowerSpot) => void;
};

export function HeroCarousel({ spots, onPress }: HeroCarouselProps) {
  if (spots.length === 0) {
    return null;
  }

  return (
    <Carousel itemWidth={CARD_WIDTH} itemGap={12} padding={24}>
      {spots.map((spot) => (
        <Carousel.Item key={spot.id}>
          <Pressable style={styles.card} onPress={() => onPress(spot)}>
            <Image
              source={
                spot.thumbnailUrl
                  ? { uri: spot.thumbnailUrl }
                  : { uri: '' }
              }
              style={styles.image}
              resizeMode="cover"
            />
            <View style={styles.overlay}>
              <Badge size="small" type="blue" badgeStyle="fill">
                {spot.badge}
              </Badge>
              <Text style={styles.place}>{spot.place}</Text>
              <Text style={styles.flower}>{spot.flower} · {spot.location}</Text>
            </View>
          </Pressable>
        </Carousel.Item>
      ))}
    </Carousel>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E8F5E9',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
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
