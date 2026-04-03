import { Badge } from '@toss/tds-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { FlowerSpot } from '@flower-map/flower-domain';

type SpotListItemProps = {
  spot: FlowerSpot;
  onPress: (spot: FlowerSpot) => void;
};

export function SpotListItem({ spot, onPress }: SpotListItemProps) {
  return (
    <Pressable style={styles.item} onPress={() => onPress(spot)}>
      <View style={styles.body}>
        <Text style={styles.place}>{spot.place}</Text>
        <View style={styles.meta}>
          <Text style={styles.flower}>{spot.flower}</Text>
          <Text style={styles.separator}>·</Text>
          <Text style={styles.location}>{spot.location}</Text>
        </View>
        {spot.description ? (
          <Text style={styles.description} numberOfLines={1}>
            {spot.description}
          </Text>
        ) : null}
      </View>
      <Badge size="small" type="green" badgeStyle="weak">
        {spot.badge}
      </Badge>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EDE8',
    backgroundColor: '#FFFFFF',
  },
  body: { flex: 1, gap: 4, marginRight: 8 },
  place: { fontSize: 16, fontWeight: '600', color: '#142218' },
  meta: { flexDirection: 'row', gap: 4 },
  flower: { fontSize: 13, color: '#5C9E66' },
  separator: { fontSize: 13, color: '#CCC' },
  location: { fontSize: 13, color: '#888' },
  description: { fontSize: 13, color: '#888' },
});
