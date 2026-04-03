import { Icon, Loader, PageNavbar } from '@toss/tds-react-native';
import { useQuery } from '@tanstack/react-query';
import { createRoute } from '@granite-js/react-native';
import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const { data: spots = [], isPending: spotsPending } = useQuery({
    queryKey: ['all-spots'],
    queryFn: getAllSpots,
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
        ref={scrollRef}
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        onScroll={(e) => setShowScrollTop(e.nativeEvent.contentOffset.y > 300)}
        scrollEventThrottle={100}
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
      {showScrollTop && (
        <Pressable
          style={styles.scrollTopBtn}
          onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
        >
          <Icon name="icon-arrow-up-sidebar-mono" size={20} color="#FFFFFF" />
        </Pressable>
      )}
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
  scrollTopBtn: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#C45C7E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C45C7E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
