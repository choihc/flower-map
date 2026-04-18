import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

type NowScoreBadgesProps = {
  bloomScore?: number;
  trendScore?: number;
  yoyScore?: number;
};

type BadgeDefinition = {
  id: 'bloom-peak' | 'trending' | 'yoy-rising';
  emoji: string;
  label: string;
};

// SSOT: apps/web/src/lib/now-score/weights.ts · BADGE_THRESHOLDS — 변경 시 웹/모바일 동기화 필요
const BLOOM_PEAK_THRESHOLD = 80;
const TRENDING_THRESHOLD = 70;
const YOY_RISING_THRESHOLD = 70;

function resolveBadges({ bloomScore, trendScore, yoyScore }: NowScoreBadgesProps): BadgeDefinition[] {
  const badges: BadgeDefinition[] = [];

  if (bloomScore !== undefined && bloomScore >= BLOOM_PEAK_THRESHOLD) {
    badges.push({ id: 'bloom-peak', emoji: '🌸', label: '만개 절정' });
  }
  if (trendScore !== undefined && trendScore >= TRENDING_THRESHOLD) {
    badges.push({ id: 'trending', emoji: '🔥', label: '지금 화제' });
  }
  if (yoyScore !== undefined && yoyScore >= YOY_RISING_THRESHOLD) {
    badges.push({ id: 'yoy-rising', emoji: '📈', label: '작년보다 ↑' });
  }

  return badges;
}

export function NowScoreBadges(props: NowScoreBadgesProps) {
  const badges = resolveBadges(props);

  if (badges.length === 0) {
    return null;
  }

  return (
    <View testID="now-score-badges" style={styles.row}>
      {badges.map((badge) => (
        <View key={badge.id} testID={`now-score-badge-${badge.id}`} style={styles.chip}>
          <Text style={styles.chipText}>
            {badge.emoji} {badge.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
});
