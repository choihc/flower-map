import { Loader, PageNavbar } from '@toss/tds-react-native';
import { useQueries } from '@tanstack/react-query';
import { createRoute } from '@granite-js/react-native';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getSpotById, type FlowerSpot } from '@flower-map/flower-domain';

import { useStorage } from '../src/shared/hooks/useStorage';
import { SavedSpotCard } from '../src/features/saved/components/SavedSpotCard';

export const Route = createRoute('/saved', {
  component: SavedPage,
});

function SavedPage() {
  const navigation = Route.useNavigation();
  const { savedIds, remove } = useStorage();

  const spotQueries = useQueries({
    queries: savedIds.map((id) => ({
      queryKey: ['spot', id],
      queryFn: () => getSpotById(id),
      enabled: Boolean(id),
    })),
  });

  const isPending = spotQueries.some((q) => q.isPending);
  const spots = spotQueries
    .map((q) => q.data)
    .filter((s): s is FlowerSpot => s !== undefined && s !== null);

  const handlePress = (spot: FlowerSpot) => {
    navigation.navigate('/spot/:id' as never, { id: spot.id } as never);
  };

  return (
    <View style={styles.page}>
      <PageNavbar><PageNavbar.Title>저장</PageNavbar.Title></PageNavbar>
      {isPending && savedIds.length > 0 ? (
        <View style={styles.center}>
          <Loader size="large" type="primary" />
        </View>
      ) : spots.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🤍</Text>
          <Text style={styles.emptyTitle}>저장된 명소가 없어요</Text>
          <Text style={styles.emptySubtitle}>마음에 드는 명소를 저장해보세요</Text>
          <Pressable style={styles.emptyBtn} onPress={() => navigation.navigate('/' as never)}>
            <Text style={styles.emptyBtnText}>명소 둘러보기</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {spots.map((spot) => (
            <SavedSpotCard
              key={spot.id}
              spot={spot}
              onPress={handlePress}
              onRemove={remove}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#FFF5F8' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingTop: 12, paddingBottom: 24 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 32,
  },
  emptyIcon: { fontSize: 48, marginBottom: 4 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#3D1A27' },
  emptySubtitle: { fontSize: 14, color: '#8B5A6E', textAlign: 'center' },
  emptyBtn: {
    marginTop: 16,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#C45C7E',
  },
  emptyBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
