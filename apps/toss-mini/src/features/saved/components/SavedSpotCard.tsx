import { Badge, Icon } from '@toss/tds-react-native';
import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { FlowerSpot } from '@flower-map/flower-domain';

const TONE_BG: Record<string, string> = {
  pink: '#FBE8F0',
  yellow: '#FBF0C0',
  green: '#E8F5E9',
};

type SavedSpotCardProps = {
  spot: FlowerSpot;
  onPress: (spot: FlowerSpot) => void;
  onRemove: (id: string) => void;
};

export function SavedSpotCard({ spot, onPress, onRemove }: SavedSpotCardProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const uri = spot.thumbnailUrl ?? spot.flowerThumbnailUrl;

  return (
    <Pressable style={styles.card} onPress={() => onPress(spot)}>
      {uri && !imgFailed ? (
        <Image
          source={{ uri }}
          style={styles.image}
          resizeMode="cover"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <View style={[styles.image, { backgroundColor: TONE_BG[spot.tone] ?? '#FBE8F0' }]} />
      )}
      <View style={styles.body}>
        <Badge size="small" type="red" badgeStyle="weak">{spot.flower}</Badge>
        <Text style={styles.place} numberOfLines={1}>{spot.place}</Text>
        <Text style={styles.meta}>{spot.location} · {spot.bloomStatus}</Text>
      </View>
      <Pressable
        style={styles.deleteBtn}
        onPress={() => onRemove(spot.id)}
        hitSlop={8}
      >
        <Icon name="icon-x-circle-mono" size={22} color="#C45C7E" />
      </Pressable>
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
  },
  body: { flex: 1, gap: 4 },
  place: { fontSize: 15, fontWeight: '600', color: '#3D1A27' },
  meta: { fontSize: 12, color: '#8B5A6E' },
  deleteBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
