import { Loader, PageNavbar, SearchField } from '@toss/tds-react-native';
import { useQuery } from '@tanstack/react-query';
import { createRoute } from '@granite-js/react-native';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { getFeaturedSpots, getFlowerFilters, type FlowerSpot } from '@flower-map/flower-domain';

import { FlowerFilterChips } from '../src/features/home/components/FlowerFilterChips';
import { SpotListItem } from '../src/features/search/components/SpotListItem';

export const Route = createRoute('/search', {
  component: SearchPage,
});

function SearchPage() {
  const navigation = Route.useNavigation();
  const [query, setQuery] = useState('');
  const [selectedFlower, setSelectedFlower] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  const { data: spots = [], isPending } = useQuery({
    queryKey: ['featured-spots'],
    queryFn: () => getFeaturedSpots(100),
  });

  const { data: filters = [] } = useQuery({
    queryKey: ['flower-filters'],
    queryFn: getFlowerFilters,
  });

  const locationFilters = useMemo(
    () => Array.from(new Set(spots.map((s) => s.location))).filter(Boolean),
    [spots],
  );

  const results = useMemo(() => {
    let list = spots;
    if (selectedFlower) {
      list = list.filter((s) => s.flower === selectedFlower);
    }
    if (selectedLocation) {
      list = list.filter((s) => s.location === selectedLocation);
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.place.toLowerCase().includes(q) ||
          s.location.toLowerCase().includes(q) ||
          (s.description?.toLowerCase().includes(q) ?? false),
      );
    }
    return list;
  }, [spots, query, selectedFlower, selectedLocation]);

  const handlePress = (spot: FlowerSpot) => {
    navigation.navigate('/spot/:id' as never, { id: spot.id } as never);
  };

  return (
    <View style={styles.page}>
      <PageNavbar><PageNavbar.Title>검색</PageNavbar.Title></PageNavbar>
      <View style={styles.searchBox}>
        <SearchField
          placeholder="명소 이름, 지역으로 검색"
          value={query}
          onChangeText={setQuery}
          onClear={() => setQuery('')}
        />
      </View>
      <FlowerFilterChips
        filters={filters}
        selected={selectedFlower}
        onSelect={setSelectedFlower}
      />
      <FlowerFilterChips
        filters={locationFilters}
        selected={selectedLocation}
        onSelect={setSelectedLocation}
      />
      {isPending ? (
        <View style={styles.center}>
          <Loader size="medium" type="primary" />
        </View>
      ) : (
        <ScrollView>
          {results.map((spot) => (
            <SpotListItem key={spot.id} spot={spot} onPress={handlePress} />
          ))}
          {results.length === 0 && (
            <Text style={styles.empty}>검색 결과가 없습니다.</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#FFFFFF' },
  searchBox: { paddingHorizontal: 16, paddingVertical: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  empty: { textAlign: 'center', color: '#888', marginTop: 40, fontSize: 15 },
});
