import { Loader, PageNavbar } from '@toss/tds-react-native';
import { useQuery } from '@tanstack/react-query';
import { createRoute } from '@granite-js/react-native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  getAllSpots,
  getFlowerFilters,
  type FlowerSpot,
} from '@flower-map/flower-domain';

import { HeroCarousel } from '../src/features/home/components/HeroCarousel';
import { FlowerFilterChips } from '../src/features/home/components/FlowerFilterChips';
import { SpotCard } from '../src/features/home/components/SpotCard';

export const Route = createRoute('/', {
  component: HomePage,
});

function HomePage() {
  const navigation = Route.useNavigation();
  const [selectedFlower, setSelectedFlower] = useState<string | null>(null);

  const { data: spots = [], isPending: spotsPending } = useQuery({
    queryKey: ['all-spots'],
    queryFn: () => getAllSpots(100),
  });

  const { data: filters = [] } = useQuery({
    queryKey: ['flower-filters'],
    queryFn: getFlowerFilters,
  });

  const filteredSpots = selectedFlower
    ? spots.filter((s) => s.flower === selectedFlower)
    : spots;

  const heroSpots = spots.slice(0, 5);

  const handleSpotPress = (spot: FlowerSpot) => {
    navigation.navigate('/spot/:id' as never, { id: spot.id } as never);
  };

  if (spotsPending) {
    return (
      <View style={styles.center}>
        <Loader size="large" type="primary" />
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <PageNavbar><PageNavbar.Title>꽃 어디</PageNavbar.Title></PageNavbar>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <HeroCarousel spots={heroSpots} onPress={handleSpotPress} />

        <FlowerFilterChips
          filters={filters}
          selected={selectedFlower}
          onSelect={setSelectedFlower}
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {selectedFlower ? `${selectedFlower} 명소` : '지금 보기 좋은 명소'}
          </Text>
          {filteredSpots.map((spot) => (
            <SpotCard key={spot.id} spot={spot} onPress={handleSpotPress} />
          ))}
          {filteredSpots.length === 0 && (
            <Text style={styles.empty}>해당 꽃 명소가 없습니다.</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#FFF5F8' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  content: { paddingBottom: 24 },
  section: { marginTop: 8 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3D1A27',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  empty: {
    textAlign: 'center',
    color: '#B09099',
    marginTop: 24,
  },
});
