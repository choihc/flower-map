import { useQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';

import {
  getActiveHomeCurationSlots,
  homeCurationKeys,
} from '../../../shared/data/homeCurationRepository';
import { SkeletonBox } from '../../../shared/ui/SkeletonBox';
import { SeasonCurationSlot } from './SeasonCurationSlot';

export function CurationSection() {
  const { data: slots = [], isPending, error } = useQuery({
    queryKey: homeCurationKeys.active,
    queryFn: getActiveHomeCurationSlots,
  });

  // 에러는 console.error로 관측. (FR-6) — 단, 표시할 캐시 데이터가 있으면 가리지 않는다(아래).
  if (error) {
    console.error('[CurationSection] curation query error:', error);
  }

  const validSlots = slots.filter(
    (slot) => slot.title.trim().length > 0 && slot.ctaLabel.trim().length > 0,
  );

  // 표시할 데이터가 있으면 렌더한다. 백그라운드 리패치가 실패(error)해도
  // 복원/캐시된 데이터는 계속 노출한다(stale-while-revalidate, FR-8).
  if (validSlots.length > 0) {
    return (
      <View testID="curation-section" style={styles.curationSection}>
        {validSlots.map((slot) => (
          <SeasonCurationSlot key={slot.id} slot={slot} />
        ))}
      </View>
    );
  }

  // 데이터가 아직 없고 응답 전이면 자기 영역 스켈레톤. (FR-4)
  if (isPending) {
    return (
      <View testID="curation-skeleton" style={styles.curationSection}>
        <SkeletonBox height={92} />
      </View>
    );
  }

  // 빈 결과(FR-5) 또는 데이터 없는 에러(FR-6) → 섹션 숨김.
  return null;
}

const styles = StyleSheet.create({
  curationSection: {
    marginBottom: 4,
  },
});
