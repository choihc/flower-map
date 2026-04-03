import { Badge } from '@toss/tds-react-native';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { FlowerSpot } from '@flower-map/flower-domain';

type SpotCardProps = {
  spot: FlowerSpot;
  onPress: (spot: FlowerSpot) => void;
};

const TONE_BADGE: Record<FlowerSpot['tone'], 'teal' | 'blue' | 'green'> = {
  green: 'green',
  pink: 'blue',
  yellow: 'teal',
};

export function SpotCard({ spot, onPress }: SpotCardProps) {
  return (
    <Pressable style={styles.card} onPress={() => onPress(spot)}>
      {spot.thumbnailUrl && (
        <Image
          source={{ uri: spot.thumbnailUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      )}
      <View style={styles.body}>
        <View style={styles.row}>
          <Badge size="small" type={TONE_BADGE[spot.tone]} badgeStyle="weak">
            {spot.badge}
          </Badge>
        </View>
        <Text style={styles.place}>{spot.place}</Text>
        <Text style={styles.flower}>{spot.flower}</Text>
        {spot.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {spot.description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: '#F0F0F0',
  },
  body: {
    padding: 16,
    gap: 6,
  },
  row: {
    flexDirection: 'row',
  },
  place: {
    fontSize: 18,
    fontWeight: '700',
    color: '#142218',
  },
  flower: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5C9E66',
  },
  description: {
    fontSize: 13,
    color: '#5E7262',
    lineHeight: 18,
  },
});
