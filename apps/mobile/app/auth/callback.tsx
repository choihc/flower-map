import { useEffect } from 'react';

import { useRouter } from 'expo-router';
import { Platform } from 'react-native';
import { Text, View } from 'react-native';

import { supabase } from '../../src/shared/lib/supabase';

// 네이티브는 auth.ts의 openAuthSessionAsync에서 코드 교환 처리
// 이 라우트는 웹 전용
export default function AuthCallbackRoute() {
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS !== 'web') {
      router.replace('/');
      return;
    }

    const url = window.location.href;
    supabase.auth.exchangeCodeForSession(url).then(({ error }) => {
      if (!error) router.replace('/');
    });
  }, []);

  return (
    <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
      <Text>로그인 처리 중...</Text>
    </View>
  );
}
