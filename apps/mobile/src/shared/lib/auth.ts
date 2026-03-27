import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

export async function signInWithKakao(): Promise<void> {
  const redirectTo =
    Platform.OS === 'web'
      ? window.location.origin + '/auth/callback'
      : Linking.createURL('/auth/callback');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: {
      redirectTo,
      skipBrowserRedirect: Platform.OS !== 'web',
    },
  });

  if (error) throw error;

  if (Platform.OS !== 'web' && data?.url) {
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type === 'success') {
      await supabase.auth.exchangeCodeForSession(result.url);
    }
  }
}
