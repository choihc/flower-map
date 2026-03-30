import { useCallback, useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { useFocusEffect, useRouter } from 'expo-router';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { getPublishedSpots, spotKeys } from '../../../shared/data/spotRepository';
import { getAllLikedIds } from '../../../shared/data/likeRepository';
import * as AppleAuthentication from 'expo-apple-authentication';

import { signInWithApple, signInWithKakao } from '../../../shared/lib/auth';
import { useAuth } from '../../../shared/context/AuthContext';
import { colors } from '../../../shared/theme/colors';
import { NativeSpotAd } from '../../../shared/ui/NativeSpotAd';
import { ScreenShell } from '../../../shared/ui/ScreenShell';
import { SectionCard } from '../../../shared/ui/SectionCard';

export function SavedScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: spots = [] } = useQuery({
    queryKey: spotKeys.all,
    queryFn: getPublishedSpots,
  });
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<'전체' | '지금 시즌' | '종료 임박'>('전체');

  useFocusEffect(
    useCallback(() => {
      getAllLikedIds().then((ids) => setLikedIds(new Set(ids)));
    }, []),
  );

  const savedSpots = spots.filter((spot) => likedIds.has(spot.id));

  const filteredSpots = savedSpots.filter((spot) => {
    if (activeFilter === '지금 시즌') return spot.bloomStatus !== '개화 종료';
    if (activeFilter === '종료 임박') return spot.badge === '이번 주 절정';
    return true;
  });

  return (
    <ScreenShell
      title="저장한 명소"
      subtitle="이번 시즌 다시 가볼 만한 꽃 명소를 모아봤어요."
    >
      <View style={styles.filterRow}>
        {(['전체', '지금 시즌', '종료 임박'] as const).map((label) => (
          <Pressable
            key={label}
            onPress={() => setActiveFilter(label)}
            style={[styles.filterChip, activeFilter === label ? styles.filterChipActive : null]}
          >
            <Text style={[styles.filterChipText, activeFilter === label ? styles.filterChipTextActive : null]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      <SectionCard title="저장 목록">
        {filteredSpots.length === 0 ? (
          <Text style={styles.emptyText}>
            {savedSpots.length === 0
              ? '저장한 명소가 없어요. 명소 상세에서 ♡ 버튼을 눌러보세요.'
              : `'${activeFilter}' 조건에 맞는 저장 명소가 없어요.`}
          </Text>
        ) : (
          filteredSpots.map((spot) => (
            <Pressable key={spot.id} onPress={() => router.push(`/spot/${spot.slug}`)} style={styles.savedRow}>
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
                <Text style={styles.savedActionPrimary}>상세 보기</Text>
              </View>
            </Pressable>
          ))
        )}
      </SectionCard>

      {!user && (
        <SectionCard title="계정 연동">
          <Text style={styles.loginCopy}>로그인하면 기기 변경 시에도 저장한 명소 목록이 그대로 유지돼요.</Text>
          <Pressable onPress={signInWithKakao} style={styles.loginButton}>
            <Text style={styles.loginButtonText}>카카오로 로그인하기</Text>
          </Pressable>
          {Platform.OS === 'ios' && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={999}
              onPress={signInWithApple}
              style={styles.appleButton}
            />
          )}
        </SectionCard>
      )}

      <NativeSpotAd />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    paddingVertical: 16,
    textAlign: 'center',
  },
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
  appleButton: {
    alignSelf: 'flex-start',
    height: 44,
    marginTop: 8,
    width: '100%',
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
