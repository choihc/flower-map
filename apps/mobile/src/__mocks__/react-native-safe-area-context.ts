// mock for react-native-safe-area-context in vitest
import React from 'react';

const SafeAreaView = React.forwardRef(
  ({ children, ...props }: Record<string, unknown>, ref: React.Ref<unknown>) =>
    React.createElement('safeareaview', { ref, ...props }, children as React.ReactNode),
);
SafeAreaView.displayName = 'SafeAreaView';

export { SafeAreaView };
export const useSafeAreaInsets = () => ({ top: 0, bottom: 0, left: 0, right: 0 });
