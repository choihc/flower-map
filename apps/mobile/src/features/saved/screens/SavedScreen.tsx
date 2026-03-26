import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../../shared/theme/colors';
import { featuredSpots } from '../../../shared/mocks/spots';
import { ScreenShell } from '../../../shared/ui/ScreenShell';
import { SectionCard } from '../../../shared/ui/SectionCard';

export function SavedScreen() {
  const router = useRouter();

  return (
    <ScreenShell
      title="저장한 명소"
      subtitle="이번 시즌 다시 가볼 만한 꽃 명소를 모아봤어요."
    >
      <View style={styles.filterRow}>
        {['전체', '지금 시즌', '종료 임박'].map((label, index) => (
          <View key={label} style={[styles.filterChip, index === 1 ? styles.filterChipActive : null]}>
            <Text style={[styles.filterChipText, index === 1 ? styles.filterChipTextActive : null]}>{label}</Text>
          </View>
        ))}
      </View>

      <SectionCard title="저장 목록">
        {featuredSpots.slice(0, 2).map((spot) => (
          <Pressable key={spot.id} onPress={() => router.push(`/spot/${spot.id}`)} style={styles.savedRow}>
            <View style={styles.savedRowHeader}>
              <Text style={styles.savedTitle}>{spot.place}</Text>
              <View style={styles.savedBadge}>
                <Text style={styles.savedBadgeText}>{spot.bloomStatus}</Text>
              </View>
            </View>
            <Text style={styles.savedMeta}>
              {spot.flower} · {spot.location}
            </Text>
            <View style={styles.savedActions}>
              <Text style={styles.savedActionPrimary}>길찾기</Text>
              <Text style={styles.savedActionSecondary}>삭제</Text>
            </View>
          </Pressable>
        ))}
      </SectionCard>

      <SectionCard title="계정 연동">
        <Text style={styles.loginCopy}>로그인하면 기기 변경 시에도 저장한 명소 목록이 그대로 유지돼요.</Text>
        <Pressable style={styles.loginButton}>
          <Text style={styles.loginButtonText}>로그인하기</Text>
        </Pressable>
      </SectionCard>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  filterChip: {
    backgroundColor: colors.cardAlt,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  loginButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: 999,
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  loginCopy: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  savedActionPrimary: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  savedActionSecondary: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  savedActions: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 12,
  },
  savedBadge: {
    backgroundColor: colors.softPink,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  savedBadgeText: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '700',
  },
  savedMeta: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
  savedRow: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingVertical: 14,
  },
  savedRowHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  savedTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
});
