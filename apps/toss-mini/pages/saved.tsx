import { ErrorPage, Loader, Navbar } from '@toss/tds-react-native';
import { useQueries } from '@tanstack/react-query';
import { createRoute } from '@granite-js/react-native';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
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
      <Navbar title="저장" />
      {isPending && savedIds.length > 0 ? (
        <View style={styles.center}>
          <Loader size="large" type="primary" />
        </View>
      ) : spots.length === 0 ? (
        <ErrorPage
          title="저장된 명소가 없어요"
          subtitle="마음에 드는 명소를 저장해보세요"
          onPressRightButton={() => navigation.navigate('/' as never)}
        />
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
  page: { flex: 1, backgroundColor: '#F4F8F4' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingTop: 12, paddingBottom: 24 },
});
