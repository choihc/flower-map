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

  // 응답 전이면 헤더 + 자기 영역 스켈레톤. (FR-4)
  if (isPending) {
    return (
      <View testID="region-skeleton">
        <SectionHeading meta="주말 나들이 큐레이션" title="지역별 추천" />
        <View style={styles.regionGrid}>
          <SkeletonBox height={92} width="48%" />
          <SkeletonBox height={92} width="48%" />
        </View>
      </View>
    );
  }

  // 에러는 섹션 숨김 + console.error로 관측. (FR-6)
  if (error) {
    console.error('[RegionRecommendSection] spots query error:', error);
    return null;
  }

  // 표시할 지역 요약이 없으면 섹션을 숨긴다. (FR-5)
  if (regionSummaries.length === 0) return null;

  return (
    <>
      <SectionHeading meta="주말 나들이 큐레이션" title="지역별 추천" />
      <View style={styles.regionGrid}>
        {regionSummaries.map((item, index) => (
          <Pressable
            key={item}
            onPress={() => router.push({ pathname: '/(tabs)/search', params: { query: item } })}
            style={[styles.regionTile, index % 2 === 0 ? styles.regionTileTall : null]}
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
  regionTileTall: {},
  regionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
});
