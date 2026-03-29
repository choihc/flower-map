import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';

import { AuthProvider } from '../src/shared/context/AuthContext';
import { queryClient } from '../src/shared/lib/queryClient';
import { registerPushToken } from '../src/shared/lib/pushNotifications';

export default function RootLayout() {
  useEffect(() => {
    registerPushToken().catch((err) => {
      console.error('[pushNotifications] 등록 실패:', err);
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="list" />
          <Stack.Screen name="filters" />
          <Stack.Screen name="spot/[slug]" />
          <Stack.Screen name="auth/callback" />
          <Stack.Screen name="+not-found" />
        </Stack>
      </AuthProvider>
    </QueryClientProvider>
  );
}
