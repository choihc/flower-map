// react-native mock for vitest (jsdom environment)
import React from 'react';

type StyleProp = object | undefined | null | false | Array<StyleProp>;

// StyleSheet mock
const StyleSheet = {
  create: <T extends Record<string, object>>(styles: T): T => {
    // Return plain objects (not proxy) to avoid react-dom style assignment issues
    const result = {} as T;
    for (const key in styles) {
      result[key] = { ...styles[key] } as T[typeof key];
    }
    return result;
  },
  flatten: (style: StyleProp): object => {
    if (!style) return {};
    if (Array.isArray(style)) return Object.assign({}, ...style.map(StyleSheet.flatten));
    return { ...(style as object) };
  },
};

// Primitive component factory
function createComponent(name: string) {
  const Component = React.forwardRef(
    ({ children, testID, style: _style, ...props }: Record<string, unknown>, ref: React.Ref<unknown>) => {
      // Drop 'style' prop — react-native style objects aren't valid DOM styles
      return React.createElement(name.toLowerCase(), { ref, 'data-testid': testID, ...props }, children);
    },
  );
  Component.displayName = name;
  return Component;
}

const View = createComponent('View');
const Text = createComponent('Text');
const Image = createComponent('Image');
const TextInput = createComponent('TextInput');
const ScrollView = createComponent('ScrollView');
const TouchableOpacity = createComponent('TouchableOpacity');
const TouchableHighlight = createComponent('TouchableHighlight');
const FlatList = React.forwardRef(
  ({ data, renderItem, keyExtractor, testID, ListHeaderComponent, ListFooterComponent, style: _style, contentContainerStyle: _ccs, ...props }: Record<string, unknown>, ref: React.Ref<unknown>) => {
    const items = Array.isArray(data) ? data : [];
    const header = ListHeaderComponent
      ? React.isValidElement(ListHeaderComponent)
        ? ListHeaderComponent
        : React.createElement(ListHeaderComponent as React.ComponentType)
      : null;
    const footer = ListFooterComponent
      ? React.isValidElement(ListFooterComponent)
        ? ListFooterComponent
        : React.createElement(ListFooterComponent as React.ComponentType)
      : null;
    return React.createElement(
      'flatlist',
      { ref, 'data-testid': testID, ...props },
      header,
      ...items.map((item: unknown, index: number) => {
        const key = keyExtractor ? (keyExtractor as (item: unknown, index: number) => string)(item, index) : String(index);
        return React.createElement(React.Fragment, { key }, (renderItem as (info: { item: unknown; index: number }) => React.ReactNode)({ item, index }));
      }),
      footer,
    );
  },
);
FlatList.displayName = 'FlatList';

const Pressable = React.forwardRef(
  ({ children, onPress, testID, style: _style, ...props }: Record<string, unknown>, ref: React.Ref<unknown>) => {
    // Drop 'style' prop — react-native style objects aren't valid DOM styles
    return React.createElement(
      'pressable',
      { ref, 'data-testid': testID, onClick: onPress, ...props },
      children,
    );
  },
);
Pressable.displayName = 'Pressable';

const ActivityIndicator = createComponent('ActivityIndicator');
const Modal = createComponent('Modal');
const SafeAreaView = createComponent('SafeAreaView');

// Platform mock
const Platform = {
  OS: 'ios' as const,
  Version: '14.0',
  select: <T>(obj: { ios?: T; android?: T; default?: T }): T => {
    return (obj.ios ?? obj.default) as T;
  },
};

// Alert mock
const Alert = {
  alert: () => {},
};

// Dimensions mock
const Dimensions = {
  get: (_dim: string) => ({ width: 375, height: 812, scale: 2, fontScale: 1 }),
  addEventListener: () => ({ remove: () => {} }),
};

// Keyboard mock
const Keyboard = {
  dismiss: () => {},
  addListener: () => ({ remove: () => {} }),
};

// Animated mock
const Animated = {
  Value: class {
    _value: number;
    constructor(value: number) { this._value = value; }
    setValue(_value: number) {}
    interpolate() { return this; }
    addListener() { return { remove: () => {} }; }
    removeListener() {}
  },
  timing: () => ({ start: (cb?: () => void) => cb?.() }),
  spring: () => ({ start: (cb?: () => void) => cb?.() }),
  parallel: () => ({ start: (cb?: () => void) => cb?.() }),
  sequence: () => ({ start: (cb?: () => void) => cb?.() }),
  View: createComponent('Animated.View'),
  Text: createComponent('Animated.Text'),
  Image: createComponent('Animated.Image'),
  createAnimatedComponent: (Component: React.ComponentType) => Component,
};

export {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableHighlight,
  TouchableOpacity,
  View,
};
