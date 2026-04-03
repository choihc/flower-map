import { useNavigation } from '@granite-js/react-native';
import React from 'react';
import { ErrorUtils, View } from 'react-native';
import { TabBar } from '../src/shared/components/TabBar';
import { ErrorBoundary } from '../src/shared/components/ErrorBoundary';
import { DebugPanel } from '../src/shared/components/DebugPanel';

// React 트리 밖 JS 에러도 콘솔에 기록
const prevHandler = ErrorUtils.getGlobalHandler();
ErrorUtils.setGlobalHandler((error, isFatal) => {
  console.error(`[GlobalError][isFatal=${isFatal}]`, error?.message ?? error, error?.stack);
  prevHandler?.(error, isFatal);
});

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigation = useNavigation();
  const state = navigation.getState();
  const currentRoute = (state?.routes[state.index]?.name as string) ?? '/';

  return (
    <ErrorBoundary>
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>{children}</View>
        <TabBar
          currentRoute={currentRoute}
          onNavigate={(route) => navigation.navigate(route as never)}
        />
        <DebugPanel />
      </View>
    </ErrorBoundary>
  );
}
