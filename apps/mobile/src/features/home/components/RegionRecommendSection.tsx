import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import {
  deriveRegionSummaries,
  getPublishedSpots,
  spotKeys,
} from '../../../shared/data/spotRepository';
import { colors } from '../../../shared/theme/colors';
import { SkeletonBox } from '../../../shared/ui/SkeletonBox';
import { SectionHeading } from './SectionHeading';

export function RegionRecommendSection() {
  const router = useRouter();
  const { data: spots = [], isPending, error } = useQuery({
    queryKey: spotKeys.all,
    queryFn: getPublishedSpots,
  });

  const regionSummaries = useMemo(() => deriveRegionSummaries(spots), [spots]);

  // 에러는 console.error로 관측. (FR-6) — 표시할 캐시 데이터가 있으면 가리지 않는다(아래).
  if (error) {
    console.error('[RegionRecommendSection] spots query error:', error);
  }

  // 표시할 지역 요약이 있으면 렌더한다. 백그라운드 리패치 실패(error)와 무관하게
  // 복원/캐시된 데이터는 계속 노출한다(stale-while-revalidate, FR-8).
  if (regionSummaries.length === 0 && isPending) {
    return (
      <View testID="region-skeleton">
        <SectionHeading meta="주말 나들이 큐레이션" title="지역별 추천" />
        <View style={styles.regionGrid}>
          <SkeletonBox testID="region-skeleton-box" height={76} width="48%" borderRadius={24} />
          <SkeletonBox testID="region-skeleton-box" height={76} width="48%" borderRadius={24} />
        </View>
      </View>
    );
  }

  // 빈 결과(FR-5) 또는 데이터 없는 에러(FR-6) → 섹션 숨김.
  if (regionSummaries.length === 0) return null;

  return (
    <>
      <SectionHeading meta="주말 나들이 큐레이션" title="지역별 추천" />
      <View style={styles.regionGrid}>
        {regionSummaries.map((item) => (
          <Pressable
            key={item}
            onPress={() => router.push({ pathname: '/(tabs)/search', params: { query: item } })}
            style={styles.regionTile}
          >
            <Text style={styles.regionTitle}>{item}</Text>
            <Text style={styles.regionHelper}>지금 인기 명소 보기</Text>
          </Pressable>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  regionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  regionHelper: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 6,
  },
  regionTile: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 10,
    padding: 16,
    width: '48%',
  },
  regionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
});
