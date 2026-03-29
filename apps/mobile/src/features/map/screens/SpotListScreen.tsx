import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useQuery } from '@tanstack/react-query';

import { deriveFlowerLabels, getPublishedSpots, spotKeys, toRegionSummary } from '../../../shared/data/spotRepository';
import { SkeletonBox } from '../../../shared/ui/SkeletonBox';
import { colors } from '../../../shared/theme/colors';
import { ScreenShell } from '../../../shared/ui/ScreenShell';
import { SectionCard } from '../../../shared/ui/SectionCard';
import { NativeSpotAd } from '../../../shared/ui/NativeSpotAd';

function getCountdownValue(value?: string) {
  if (!value) return Number.MAX_SAFE_INTEGER;
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
}

export function SpotListScreen() {
  const router = useRouter();
  const { data: featuredSpots = [], isLoading } = useQuery({
    queryKey: spotKeys.all,
    queryFn: getPublishedSpots,
  });

  const { flower, region } = useLocalSearchParams<{ flower?: string; region?: string }>();
  const initialFlower = flower && typeof flower === 'string' ? flower : '전체';
  const activeRegion = region && typeof region === 'string' ? region : null;

  const [selectedFlower, setSelectedFlower] = useState(initialFlower);
  const [sortByEnding, setSortByEnding] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const flowerOptions = ['전체', ...deriveFlowerLabels(featuredSpots)];

  let visibleSpots = featuredSpots
    .filter((spot) => (selectedFlower !== '전체' ? spot.flower === selectedFlower : true))
    .filter((spot) => (activeRegion ? toRegionSummary(spot.location) === activeRegion : true));

  if (sortByEnding) {
    visibleSpots = [...visibleSpots].sort(
      (a, b) => getCountdownValue(a.eventEndsIn) - getCountdownValue(b.eventEndsIn),
    );
  }

  const title = activeRegion ? `${activeRegion} 명소` : '명소 리스트';
  const subtitle = activeRegion
    ? `${activeRegion} 지역의 꽃 명소를 모아서 보여드려요.`
    : '지도에서 보던 조건을 리스트로 더 빠르게 비교할 수 있어요.';
  const sectionTitle =
    selectedFlower !== '전체' ? `${selectedFlower} 명소` : activeRegion ? `${activeRegion} 명소 추천` : '봄꽃 명소 추천';

  if (isLoading) {
    return (
      <ScreenShell title={title} subtitle={subtitle}>
        <SkeletonBox height={72} borderRadius={16} />
        <SkeletonBox height={72} borderRadius={16} />
        <SkeletonBox height={72} borderRadius={16} />
        <SkeletonBox height={72} borderRadius={16} />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title={title} subtitle={subtitle}>
      <View style={styles.filterRow}>
        <Pressable onPress={() => setSheetOpen(true)} style={styles.flowerFilterButton}>
          <Text style={styles.flowerFilterButtonText}>
            {selectedFlower === '전체' ? '🌸 꽃 종류' : `🌸 ${selectedFlower}`}
          </Text>
          <Text style={styles.filterChevron}>▾</Text>
        </Pressable>

        <Pressable
          onPress={() => setSortByEnding((prev) => !prev)}
          style={[styles.sortChip, sortByEnding ? styles.sortChipActive : null]}
        >
          <Text style={[styles.sortChipText, sortByEnding ? styles.sortChipTextActive : null]}>종료 임박순</Text>
        </Pressable>
      </View>

      <SectionCard title={sectionTitle}>
        {visibleSpots.slice(0, 5).map((spot) => (
          <Pressable key={spot.id} onPress={() => router.push(`/spot/${spot.slug}`)} style={styles.spotRow}>
            <View style={styles.spotContent}>
              <Text style={styles.spotTitle}>{spot.place}</Text>
              <Text style={styles.spotMeta}>
                {spot.flower} · {spot.location}
              </Text>
              <Text style={styles.spotHelper}>{spot.helper}</Text>
            </View>
            <Text style={styles.spotAction}>보기</Text>
          </Pressable>
        ))}
      </SectionCard>

      {visibleSpots.length >= 5 && <NativeSpotAd />}

      {visibleSpots.length > 5 && (
        <SectionCard>
          {visibleSpots.slice(5).map((spot) => (
            <Pressable key={spot.id} onPress={() => router.push(`/spot/${spot.slug}`)} style={styles.spotRow}>
              <View style={styles.spotContent}>
                <Text style={styles.spotTitle}>{spot.place}</Text>
                <Text style={styles.spotMeta}>
                  {spot.flower} · {spot.location}
                </Text>
                <Text style={styles.spotHelper}>{spot.helper}</Text>
              </View>
              <Text style={styles.spotAction}>보기</Text>
            </Pressable>
          ))}
        </SectionCard>
      )}

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
                style={[styles.sheetOption, isActive ? styles.sheetOptionActive : null]}
              >
                <Text style={[styles.sheetOptionText, isActive ? styles.sheetOptionTextActive : null]}>{option}</Text>
                {isActive && <Text style={styles.sheetOptionCheck}>✓</Text>}
              </Pressable>
            );
          })}
        </View>
      </Modal>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  accentGreen: {
    backgroundColor: colors.primary,
  },
  accentPink: {
    backgroundColor: colors.secondary,
  },
  accentYellow: {
    backgroundColor: colors.warning,
  },
  filterChevron: {
    color: colors.textMuted,
    fontSize: 13,
    marginLeft: 4,
  },
  filterRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  flowerFilterButton: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  flowerFilterButtonText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
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
  sortChip: {
    backgroundColor: colors.cardAlt,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sortChipActive: {
    backgroundColor: colors.primary,
  },
  sortChipText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  sortChipTextActive: {
    color: '#FFFFFF',
  },
  spotAccent: {
    alignSelf: 'stretch',
    borderRadius: 999,
    width: 6,
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
  spotTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
});
