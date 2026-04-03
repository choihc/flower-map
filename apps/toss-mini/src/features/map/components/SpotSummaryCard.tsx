import { Badge } from '@toss/tds-react-native';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { FlowerSpot } from '@flower-map/flower-domain';

type SpotSummaryCardProps = {
  spot: FlowerSpot;
  isSelected: boolean;
  onPress: (spot: FlowerSpot) => void;
};

export function SpotSummaryCard({ spot, isSelected, onPress }: SpotSummaryCardProps) {
  return (
    <Pressable
      style={[styles.card, isSelected && styles.selected]}
      onPress={() => onPress(spot)}
    >
      {spot.thumbnailUrl && (
        <Image
          source={{ uri: spot.thumbnailUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      )}
      <View style={styles.body}>
        <Badge size="small" type="green" badgeStyle="weak">
          {spot.flower}
        </Badge>
        <Text style={styles.place}>{spot.place}</Text>
        <Text style={styles.meta}>{spot.location} · {spot.bloomStatus}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  selected: {
    borderWidth: 2,
    borderColor: '#5C9E66',
  },
  image: {
    width: '100%',
    height: 120,
    backgroundColor: '#E8F5E9',
  },
  body: {
    padding: 12,
    gap: 4,
  },
  place: {
    fontSize: 14,
    fontWeight: '700',
    color: '#142218',
  },
  meta: {
    fontSize: 12,
    color: '#5E7262',
  },
});
