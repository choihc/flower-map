import { Badge, Button } from '@toss/tds-react-native';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { FlowerSpot } from '@flower-map/flower-domain';

type SavedSpotCardProps = {
  spot: FlowerSpot;
  onPress: (spot: FlowerSpot) => void;
  onRemove: (id: string) => void;
};

export function SavedSpotCard({ spot, onPress, onRemove }: SavedSpotCardProps) {
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
          <Badge size="small" type="green" badgeStyle="weak">
            {spot.flower}
          </Badge>
        </View>
        <Text style={styles.place}>{spot.place}</Text>
        <Text style={styles.meta}>{spot.location} · {spot.bloomStatus}</Text>
      </View>
      <Button
        size="tiny"
        type="danger"
        style="weak"
        onPress={() => onRemove(spot.id)}
      >
        삭제
      </Button>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  image: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#E8F5E9',
  },
  body: { flex: 1, gap: 4 },
  row: { flexDirection: 'row' },
  place: { fontSize: 15, fontWeight: '600', color: '#142218' },
  meta: { fontSize: 12, color: '#888' },
});
