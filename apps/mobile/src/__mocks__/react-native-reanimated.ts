// react-native-reanimated mock for vitest (jsdom environment)
// 실제 워크릿/애니메이션 없이 정적으로 렌더되도록 graceful degrade 한다(NFR-2).
import React from 'react';

export const Easing = {
  linear: (t: number) => t,
  ease: (t: number) => t,
  in: (fn: (t: number) => number) => fn,
  out: (fn: (t: number) => number) => fn,
  inOut: (fn: (t: number) => number) => fn,
};

export function useSharedValue<T>(initial: T): { value: T } {
  return { value: initial };
}

export function useAnimatedStyle<T extends object>(factory: () => T): T {
  try {
    return factory();
  } catch {
    return {} as T;
  }
}

export function withTiming<T>(toValue: T): T {
  return toValue;
}

export function withRepeat<T>(value: T): T {
  return value;
}

export function withSequence<T>(...values: T[]): T {
  return values[values.length - 1];
}

function createAnimatedComponent(tag: string) {
  const Component = React.forwardRef(
    (
      { children, testID, style: _style, ...props }: Record<string, unknown>,
      ref: React.Ref<unknown>,
    ) =>
      React.createElement(
        tag,
        { ref, 'data-testid': testID, ...props },
        children as React.ReactNode,
      ),
  );
  Component.displayName = `Animated.${tag}`;
  return Component;
}

const Animated = {
  View: createAnimatedComponent('view'),
  Text: createAnimatedComponent('text'),
  Image: createAnimatedComponent('image'),
  ScrollView: createAnimatedComponent('scrollview'),
  createAnimatedComponent: (C: React.ComponentType) => C,
};

export default Animated;
