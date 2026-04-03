import { Badge } from '@toss/tds-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { FlowerSpot } from '@flower-map/flower-domain';

import { SpotImage } from '../../../shared/components/SpotImage';

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
      <SpotImage spot={spot} style={styles.image} bloomSize="md" />
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
    color: '#3D1A27',
  },
  flower: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C45C7E',
  },
  description: {
    fontSize: 13,
    color: '#8B5A6E',
    lineHeight: 18,
  },
});
