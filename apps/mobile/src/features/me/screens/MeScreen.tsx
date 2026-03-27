import { Pressable, StyleSheet, Text } from 'react-native';

import { useAuth } from '../../../shared/context/AuthContext';
import { signInWithKakao } from '../../../shared/lib/auth';
import { colors } from '../../../shared/theme/colors';
import { ScreenShell } from '../../../shared/ui/ScreenShell';

export function MeScreen() {
  const { user, signOut, isLoading } = useAuth();

  if (isLoading) {
    return <ScreenShell title="내 정보" />;
  }

  if (!user) {
    return (
      <ScreenShell title="내 정보" subtitle="로그인하면 후기를 남길 수 있어요.">
        <Pressable onPress={signInWithKakao} style={styles.kakaoButton}>
          <Text style={styles.kakaoButtonText}>카카오로 로그인</Text>
        </Pressable>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title="내 정보" subtitle={user.email ?? '카카오 로그인됨'}>
      <Pressable onPress={signOut} style={styles.signOutButton}>
        <Text style={styles.signOutText}>로그아웃</Text>
      </Pressable>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  kakaoButton: {
    alignItems: 'center',
    backgroundColor: '#FEE500',
    borderRadius: 12,
    paddingVertical: 16,
  },
  kakaoButtonText: {
    color: '#191919',
    fontSize: 16,
    fontWeight: '700',
  },
  signOutButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
  },
  signOutText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
});
