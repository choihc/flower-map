import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="list" />
      <Stack.Screen name="filters" />
      <Stack.Screen name="spot/[id]" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}
