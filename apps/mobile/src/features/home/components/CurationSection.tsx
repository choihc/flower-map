import { useQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';

import {
  getActiveHomeCurationSlots,
  homeCurationKeys,
} from '../../../shared/data/homeCurationRepository';
import { SkeletonBox } from '../../../shared/ui/SkeletonBox';
import { SeasonCurationSlot } from './SeasonCurationSlot';

const CURATION_STALE_MS = 1000 * 60 * 30;

export function CurationSection() {
  const { data: slots = [], isPending, error } = useQuery({
    queryKey: homeCurationKeys.active,
    queryFn: getActiveHomeCurationSlots,
    staleTime: CURATION_STALE_MS,
  });

  // 응답 전이면 자기 영역 스켈레톤. (FR-4)
  if (isPending) {
    return (
      <View testID="curation-skeleton" style={styles.curationSection}>
        <SkeletonBox height={92} />
      </View>
    );
  }

  // 에러는 섹션 숨김 + console.error로 관측. (FR-6)
  if (error) {
    console.error('[CurationSection] curation query error:', error);
    return null;
  }

  const validSlots = slots.filter(
    (slot) => slot.title.trim().length > 0 && slot.ctaLabel.trim().length > 0,
  );

  // 유효 슬롯이 없으면 섹션을 숨긴다. (FR-5)
  if (validSlots.length === 0) return null;

  return (
    <View testID="curation-section" style={styles.curationSection}>
      {validSlots.map((slot) => (
        <SeasonCurationSlot key={slot.id} slot={slot} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  curationSection: {
    marginBottom: 4,
  },
});
