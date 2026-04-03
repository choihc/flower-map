import { useNavigation } from '@granite-js/react-native';
import React from 'react';
import { View } from 'react-native';
import { TabBar } from '../src/shared/components/TabBar';

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigation = useNavigation();
  const state = navigation.getState();
  const currentRoute = (state?.routes[state.index]?.name as string) ?? '/';

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>{children}</View>
      <TabBar
        currentRoute={currentRoute}
        onNavigate={(route) => navigation.navigate(route as never)}
      />
    </View>
  );
}
