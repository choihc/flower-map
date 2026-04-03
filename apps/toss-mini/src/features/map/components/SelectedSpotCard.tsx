import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type SelectedSpotSummary = {
  id: string;
  place: string;
  helper: string;
  flower: string;
};

type SelectedSpotCardProps = {
  spot: SelectedSpotSummary;
  onPressDetail: () => void;
};

export function SelectedSpotCard({
  spot,
  onPressDetail,
}: SelectedSpotCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.place}>{spot.place}</Text>
        <Text style={styles.flower}>{spot.flower}</Text>
      </View>
      <Text style={styles.helper}>{spot.helper}</Text>
      <Pressable style={styles.button} onPress={onPressDetail}>
        <Text style={styles.buttonText}>상세 보기</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-start',
    backgroundColor: '#1F6B45',
    borderRadius: 999,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#102012',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
  },
  flower: {
    color: '#5C9E66',
    fontSize: 14,
    fontWeight: '700',
  },
  header: {
    gap: 8,
  },
  helper: {
    color: '#516255',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
  },
  place: {
    color: '#142218',
    fontSize: 20,
    fontWeight: '800',
  },
});
