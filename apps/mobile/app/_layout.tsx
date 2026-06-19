import { useEffect } from 'react';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack } from 'expo-router';

import { AuthProvider } from '../src/shared/context/AuthContext';
import { queryClient } from '../src/shared/lib/queryClient';
import { persistOptions } from '../src/shared/lib/queryPersister';
import { registerPushToken } from '../src/shared/lib/pushNotifications';

export default function RootLayout() {
  useEffect(() => {
    registerPushToken().catch((err) => {
      console.error('[pushNotifications] 등록 실패:', err);
    });
  }, []);

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="list" />
          <Stack.Screen name="filters" />
          <Stack.Screen name="spot/[slug]" />
          <Stack.Screen name="stays/[slug]" />
          <Stack.Screen name="saved" />
          <Stack.Screen name="me" />
          <Stack.Screen name="auth/callback" />
          <Stack.Screen name="+not-found" />
        </Stack>
      </AuthProvider>
    </PersistQueryClientProvider>
  );
}
