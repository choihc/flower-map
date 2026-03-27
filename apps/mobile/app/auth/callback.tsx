import { useEffect } from 'react';

import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { supabase } from '../../src/shared/lib/supabase';

export default function AuthCallbackRoute() {
  const router = useRouter();

  useEffect(() => {
    const url = Linking.getLinkingURL();
    if (url) {
      handleDeepLink(url);
    }

    const sub = Linking.addEventListener('url', (event) => handleDeepLink(event.url));
    return () => sub.remove();
  }, []);

  async function handleDeepLink(url: string) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(url);
    if (!error && data.session) {
      router.replace('/');
    }
  }

  return (
    <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
      <Text>로그인 처리 중...</Text>
    </View>
  );
}
