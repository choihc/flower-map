import { Loader, PageNavbar } from '@toss/tds-react-native';
import { useQuery } from '@tanstack/react-query';
import { createRoute } from '@granite-js/react-native';
import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { getFeaturedSpots, getFlowerFilters, type FlowerSpot } from '@flower-map/flower-domain';

import { NaverMapCanvas } from '../src/features/map/components/NaverMapCanvas';
import { SpotSummaryCard } from '../src/features/map/components/SpotSummaryCard';
import { FlowerFilterChips } from '../src/features/home/components/FlowerFilterChips';

export const Route = createRoute('/map', {
  component: MapPage,
});

const DEFAULT_LATITUDE = 37.5665;
const DEFAULT_LONGITUDE = 126.978;

function MapPage() {
  const navigation = Route.useNavigation();
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [selectedFlower, setSelectedFlower] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const { data: spots = [], isPending } = useQuery({
    queryKey: ['featured-spots'],
    queryFn: () => getFeaturedSpots(20),
  });

  const { data: filters = [] } = useQuery({
    queryKey: ['flower-filters'],
    queryFn: getFlowerFilters,
  });

  const filteredSpots = selectedFlower
    ? spots.filter((s) => s.flower === selectedFlower)
    : spots;

  const selectedSpot = filteredSpots.find((s) => s.id === selectedSpotId) ?? filteredSpots[0];

  const handleMarkerTap = (spot: FlowerSpot) => {
    setSelectedSpotId(spot.id);
    const idx = filteredSpots.findIndex((s) => s.id === spot.id);
    if (idx >= 0 && scrollRef.current) {
      scrollRef.current.scrollTo({ x: idx * (200 + 12), animated: true });
    }
  };

  const handleCardPress = (spot: FlowerSpot) => {
    navigation.navigate('/spot/:id' as never, { id: spot.id } as never);
  };

  if (isPending) {
    return (
      <View style={styles.center}>
        <Loader size="large" type="primary" />
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <PageNavbar><PageNavbar.Title>지도</PageNavbar.Title></PageNavbar>
      <NaverMapCanvas
        latitude={selectedSpot?.latitude ?? DEFAULT_LATITUDE}
        longitude={selectedSpot?.longitude ?? DEFAULT_LONGITUDE}
        markerLatitude={selectedSpot?.latitude ?? DEFAULT_LATITUDE}
        markerLongitude={selectedSpot?.longitude ?? DEFAULT_LONGITUDE}
        onMarkerTap={() => {}}
        markerCaption={selectedSpot?.place}
      />
      <FlowerFilterChips
        filters={filters}
        selected={selectedFlower}
        onSelect={setSelectedFlower}
      />
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardList}
      >
        {filteredSpots.map((spot) => (
          <SpotSummaryCard
            key={spot.id}
            spot={spot}
            isSelected={spot.id === selectedSpotId}
            onPress={handleCardPress}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F4F8F4' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cardList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
