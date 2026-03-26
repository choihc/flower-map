import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../../shared/theme/colors';
import { flowerLabels, regionSummaries } from '../../../shared/mocks/spots';
import { ScreenShell } from '../../../shared/ui/ScreenShell';
import { SectionCard } from '../../../shared/ui/SectionCard';

export function FiltersScreen() {
  return (
    <ScreenShell title="필터" subtitle="꽃 종류와 지역 조건을 조합해서 지금 가기 좋은 명소만 추려보세요.">
      <SectionCard title="꽃 종류">
        <View style={styles.wrap}>
          {flowerLabels.map((label, index) => (
            <FilterChip key={label} active={index === 0} label={label} />
          ))}
        </View>
      </SectionCard>

      <SectionCard title="지역">
        <View style={styles.wrap}>
          {regionSummaries.map((label, index) => (
            <FilterChip key={label} active={index === 0} label={label} />
          ))}
        </View>
      </SectionCard>

      <SectionCard title="상태">
        <ToggleRow label="진행 중 축제만 보기" value="켜짐" />
        <ToggleRow label="이번 시즌만 보기" value="켜짐" />
      </SectionCard>

      <View style={styles.actionRow}>
        <Pressable style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>초기화</Text>
        </Pressable>
        <Pressable style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>적용하기</Text>
        </Pressable>
      </View>
    </ScreenShell>
  );
}

function FilterChip({ active, label }: { active?: boolean; label: string }) {
  return (
    <Pressable style={[styles.chip, active ? styles.chipActive : null]}>
      <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>{label}</Text>
    </Pressable>
  );
}

function ToggleRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <View style={styles.toggleValue}>
        <Text style={styles.toggleValueText}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  chip: {
    backgroundColor: colors.cardAlt,
    borderRadius: 999,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    flex: 1,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 14,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  toggleLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  toggleRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  toggleValue: {
    backgroundColor: colors.surfaceGreen,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  toggleValueText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
