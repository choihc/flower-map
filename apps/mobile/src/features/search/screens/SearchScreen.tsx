// src/features/search/screens/SearchScreen.tsx
import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useLocalSearchParams } from 'expo-router';

import {
  deriveFlowerLabels,
  getPublishedSpots,
  spotKeys,
} from '../../../shared/data/spotRepository';
import { colors } from '../../../shared/theme/colors';
import { SearchResultCard } from '../../../shared/ui/SearchResultCard';
import { SkeletonBox } from '../../../shared/ui/SkeletonBox';
import { NativeSpotAd } from '../../../shared/ui/NativeSpotAd';
import type { FlowerSpot } from '../../../shared/data/types';

type AdMarker = { id: '__ad__'; type: 'ad' };
type ListItem = FlowerSpot | AdMarker;

function getCountdownValue(value?: string) {
  if (!value) return Number.MAX_SAFE_INTEGER;
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
}

function SpotRow({ spot, onPress }: { spot: FlowerSpot; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.spotRow}>
      {spot.thumbnailUrl || spot.flowerThumbnailUrl ? (
        <Image
          source={{ uri: (spot.thumbnailUrl || spot.flowerThumbnailUrl)! }}
          style={styles.spotThumbnail}
        />
      ) : (
        <View style={styles.spotThumbnailPlaceholder} />
      )}
      <View style={styles.spotContent}>
        <Text style={styles.spotTitle}>{spot.place}</Text>
        <Text style={styles.spotMeta}>
          {spot.flower} · {spot.location}
        </Text>
        <Text style={styles.spotHelper} numberOfLines={2}>{spot.helper}</Text>
      </View>
      <Text style={styles.spotAction}>보기</Text>
    </Pressable>
  );
}

export function SearchScreen() {
  const router = useRouter();
  const { query: initialQuery } = useLocalSearchParams<{ query?: string }>();
  const [query, setQuery] = useState(initialQuery ?? '');
  const [selectedFlower, setSelectedFlower] = useState('전체');
  const [sortByEnding, setSortByEnding] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: spots = [], isLoading, isError } = useQuery({
    queryKey: spotKeys.all,
    queryFn: getPublishedSpots,
  });

  const flowerOptions = ['전체', ...deriveFlowerLabels(spots)];

  const trimmedQuery = query.trim();

  // 검색 결과 (검색어 있을 때)
  const searchResults = useMemo<FlowerSpot[]>(() => {
    const q = trimmedQuery.toLowerCase();
    if (!q) return [];
    let filtered = spots.filter(
      (s) =>
        s.place.toLowerCase().includes(q) ||
        s.flower.toLowerCase().includes(q) ||
        s.location.toLowerCase().includes(q) ||
        s.helper.toLowerCase().includes(q),
    );
    if (selectedFlower !== '전체') {
      filtered = filtered.filter((s) => s.flower === selectedFlower);
    }
    if (sortByEnding) {
      filtered = [...filtered].sort(
        (a, b) => getCountdownValue(a.eventEndsIn) - getCountdownValue(b.eventEndsIn),
      );
    }
    return filtered;
  }, [trimmedQuery, spots, selectedFlower, sortByEnding]);

  // 전체 리스트 (검색어 없을 때)
  const allSpots = useMemo<FlowerSpot[]>(() => {
    let filtered = selectedFlower !== '전체'
      ? spots.filter((s) => s.flower === selectedFlower)
      : spots;
    if (sortByEnding) {
      filtered = [...filtered].sort(
        (a, b) => getCountdownValue(a.eventEndsIn) - getCountdownValue(b.eventEndsIn),
      );
    }
    return filtered;
  }, [spots, selectedFlower, sortByEnding]);

  // FlatList 데이터 — 검색어 없으면 광고 마커 삽입
  const listData = useMemo<ListItem[]>(() => {
    if (trimmedQuery) return searchResults;
    if (allSpots.length <= 5) return allSpots;
    return [
      ...allSpots.slice(0, 5),
      { id: '__ad__', type: 'ad' as const },
      ...allSpots.slice(5),
    ];
  }, [trimmedQuery, searchResults, allSpots]);

  const handleNavigate = (slug: string) => router.push(`/spot/${slug}`);

  const listHeader = (
    <View style={styles.header}>
      <Text style={styles.title}>검색</Text>
      <TextInput
        style={styles.input}
        placeholder="꽃 이름, 명소, 지역으로 검색"
        placeholderTextColor={colors.textMuted}
        value={query}
        onChangeText={setQuery}
        keyboardType="default"
        returnKeyType="search"
        autoCorrect={false}
      />

      {/* 필터 / 정렬 */}
      <View style={styles.filterRow}>
        <Pressable onPress={() => setSheetOpen(true)} style={styles.filterChip}>
          <Text style={styles.filterChipText}>
            {selectedFlower === '전체' ? '🌸 꽃 종류' : `🌸 ${selectedFlower}`}
          </Text>
          <Text style={styles.filterChevron}>▾</Text>
        </Pressable>
        <Pressable
          onPress={() => setSortByEnding((prev) => !prev)}
          style={[styles.filterChip, sortByEnding && styles.filterChipActive]}
        >
          <Text style={[styles.filterChipText, sortByEnding && styles.filterChipTextActive]}>
            종료 임박순
          </Text>
        </Pressable>
      </View>

      {/* 상태 텍스트 */}
      {isLoading && (
        <View style={styles.skeletonGroup}>
          <SkeletonBox testID="skeleton-box" height={72} borderRadius={12} />
          <SkeletonBox testID="skeleton-box" height={72} borderRadius={12} />
          <SkeletonBox testID="skeleton-box" height={72} borderRadius={12} />
        </View>
      )}
      {isError && (
        <Text style={styles.stateText}>데이터를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</Text>
      )}
      {!isLoading && !isError && trimmedQuery !== '' && searchResults.length > 0 && (
        <Text style={styles.countText}>{searchResults.length}곳의 명소를 찾았어요</Text>
      )}
      {!isLoading && !isError && trimmedQuery !== '' && searchResults.length === 0 && (
        <Text style={styles.stateText}>검색 결과가 없어요</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={isLoading ? [] : listData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          if ('type' in item && item.type === 'ad') {
            return <NativeSpotAd />;
          }
          const spot = item as FlowerSpot;
          if (trimmedQuery) {
            return (
              <SearchResultCard
                spot={spot}
                onPress={() => handleNavigate(spot.slug)}
              />
            );
          }
          return <SpotRow spot={spot} onPress={() => handleNavigate(spot.slug)} />;
        }}
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      />

      {/* 꽃 종류 바텀시트 */}
      <Modal animationType="slide" transparent visible={sheetOpen} onRequestClose={() => setSheetOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setSheetOpen(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>꽃 종류 선택</Text>
          {flowerOptions.map((option) => {
            const isActive = option === selectedFlower;
            return (
              <Pressable
                key={option}
                onPress={() => {
                  setSelectedFlower(option);
                  setSheetOpen(false);
                }}
                style={[styles.sheetOption, isActive && styles.sheetOptionActive]}
              >
                <Text style={[styles.sheetOptionText, isActive && styles.sheetOptionTextActive]}>
                  {option}
                </Text>
                {isActive && <Text style={styles.sheetOptionCheck}>✓</Text>}
              </Pressable>
            );
          })}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 100,
    paddingHorizontal: 20,
  },
  countText: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 8,
  },
  filterChevron: {
    color: colors.textMuted,
    fontSize: 13,
    marginLeft: 4,
  },
  filterChip: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  filterRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  header: {
    paddingBottom: 4,
    paddingTop: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    color: colors.text,
    fontSize: 15,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  safe: {
    backgroundColor: colors.background,
    flex: 1,
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 40,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sheetBackdrop: {
    flex: 1,
  },
  sheetHandle: {
    alignSelf: 'center',
    backgroundColor: colors.border,
    borderRadius: 999,
    height: 4,
    marginBottom: 20,
    width: 40,
  },
  sheetOption: {
    alignItems: 'center',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sheetOptionActive: {
    backgroundColor: colors.surfaceGreen,
  },
  sheetOptionCheck: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  sheetOptionText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  sheetOptionTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  sheetTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  skeletonGroup: {
    gap: 10,
  },
  spotAction: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  spotContent: {
    flex: 1,
  },
  spotHelper: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  spotMeta: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  spotRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 14,
  },
  spotThumbnail: {
    borderRadius: 10,
    height: 56,
    width: 56,
  },
  spotThumbnailPlaceholder: {
    backgroundColor: colors.cardAlt,
    borderRadius: 10,
    height: 56,
    width: 56,
  },
  spotTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  stateText: {
    color: colors.textMuted,
    fontSize: 15,
    marginTop: 40,
    textAlign: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 14,
    marginTop: 8,
  },
});
