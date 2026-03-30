import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

// 네이티브에서 Linking.createURL은 개발 모드에서 exp://localhost:... 를 생성하므로
// 앱 스킴을 직접 사용해야 Kakao OAuth 후 앱으로 정상 복귀됨
const APP_SCHEME_REDIRECT = 'kkoteodi://auth/callback';

export async function signInWithKakao(): Promise<void> {
  const redirectTo =
    Platform.OS === 'web'
      ? window.location.origin + '/auth/callback'
      : APP_SCHEME_REDIRECT;

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
      const url = result.url;
      // Supabase 프로젝트 설정에 따라 PKCE(?code=) 또는 implicit(#access_token=) 응답이 올 수 있음
      if (url.includes('access_token=')) {
        // implicit flow: URL fragment에서 토큰 직접 추출
        const fragment = url.includes('#') ? url.split('#')[1] : url.split('?')[1];
        const params = new URLSearchParams(fragment ?? '');
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) throw sessionError;
        }
      } else {
        // PKCE flow: authorization code 교환
        const { error: sessionError } = await supabase.auth.exchangeCodeForSession(url);
        if (sessionError) throw sessionError;
      }
    }
  }
}

export async function signInWithApple(): Promise<void> {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      throw new Error('Apple 로그인에서 identityToken을 받지 못했습니다.');
    }

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });

    if (error) throw error;
  } catch (e: unknown) {
    // 사용자가 직접 취소한 경우는 에러로 처리하지 않음
    if (e instanceof Error && 'code' in e && (e as { code: string }).code === 'ERR_REQUEST_CANCELED') {
      return;
    }
    throw e;
  }
}
