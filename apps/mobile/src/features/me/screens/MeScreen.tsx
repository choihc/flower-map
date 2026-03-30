import { Alert, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import * as AppleAuthentication from 'expo-apple-authentication';
import Constants from 'expo-constants';

import { useAuth } from '../../../shared/context/AuthContext';
import { signInWithApple, signInWithKakao } from '../../../shared/lib/auth';
import { supabase } from '../../../shared/lib/supabase';
import { colors } from '../../../shared/theme/colors';
import { NativeSpotAd } from '../../../shared/ui/NativeSpotAd';
import { ScreenShell } from '../../../shared/ui/ScreenShell';

const CONTACT_EMAIL = 'nextvine.flow@gmail.com';
const PRIVACY_POLICY_URL = 'https://kkoteodie.nextvine.app/privacy';
const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

function AppInfoSection() {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>앱 정보</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>앱 버전</Text>
          <Text style={styles.rowValue}>{APP_VERSION}</Text>
        </View>
        <View style={styles.divider} />
        <Pressable onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`)} style={styles.row}>
          <Text style={styles.rowLabel}>문의하기</Text>
          <Text style={styles.rowAction}>→</Text>
        </Pressable>
        <View style={styles.divider} />
        <Pressable onPress={() => Linking.openURL(PRIVACY_POLICY_URL)} style={styles.row}>
          <Text style={styles.rowLabel}>개인정보 처리방침</Text>
          <Text style={styles.rowAction}>→</Text>
        </Pressable>
      </View>
    </View>
  );
}

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
        {Platform.OS === 'ios' && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={12}
            onPress={signInWithApple}
            style={styles.appleButton}
          />
        )}
        <NativeSpotAd />
        <AppInfoSection />
      </ScreenShell>
    );
  }

  const displayName =
    (user.user_metadata?.name as string | undefined) ??
    (user.user_metadata?.full_name as string | undefined) ??
    user.email ??
    '카카오 로그인됨';

  return (
    <ScreenShell title="내 정보" subtitle={displayName}>
      <NativeSpotAd />
      <AppInfoSection />
      <Pressable onPress={signOut} style={styles.signOutButton}>
        <Text style={styles.signOutText}>로그아웃</Text>
      </Pressable>
      <Pressable
        onPress={() => {
          Alert.alert(
            '계정 삭제',
            '계정과 모든 관련 데이터가 영구적으로 삭제됩니다. 계속하시겠습니까?',
            [
              { text: '취소', style: 'cancel' },
              {
                text: '삭제',
                style: 'destructive',
                onPress: async () => {
                  const { error } = await supabase.rpc('delete_user');
                  if (error) {
                    Alert.alert('오류', '계정 삭제 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
                    return;
                  }
                  await signOut();
                },
              },
            ],
          );
        }}
        style={styles.deleteButton}
      >
        <Text style={styles.deleteText}>계정 삭제</Text>
      </Pressable>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  divider: {
    backgroundColor: colors.border,
    height: 1,
    marginHorizontal: 16,
  },
  kakaoButton: {
    alignItems: 'center',
    backgroundColor: '#FEE500',
    borderRadius: 12,
    marginBottom: 32,
    paddingVertical: 16,
  },
  kakaoButtonText: {
    color: '#191919',
    fontSize: 16,
    fontWeight: '700',
  },
  appleButton: {
    height: 50,
    marginBottom: 32,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  rowAction: {
    color: colors.textMuted,
    fontSize: 16,
  },
  rowLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '500',
  },
  rowValue: {
    color: colors.textMuted,
    fontSize: 14,
  },
  section: {
    marginTop: 32,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  signOutButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
    paddingVertical: 14,
  },
  signOutText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
  deleteButton: {
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 14,
  },
  deleteText: {
    color: colors.textMuted,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});
