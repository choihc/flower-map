import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';

import { AuthProvider } from '../src/shared/context/AuthContext';
import { queryClient } from '../src/shared/lib/queryClient';

export default function RootLayout() {
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
