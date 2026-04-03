import React from 'react';
import { View } from 'react-native';
import { vi } from 'vitest';

export const Storage = {
  getItem: vi.fn(async (_key: string): Promise<string | null> => null),
  setItem: vi.fn(async (_key: string, _value: string): Promise<void> => {}),
  removeItem: vi.fn(async (_key: string): Promise<void> => {}),
};

export const InlineAd = vi.fn(({ adId: _adId, impressFallbackOnMount: _imp, style }: {
  adId: string;
  impressFallbackOnMount?: boolean;
  style?: object;
}) => React.createElement(View, { style, testID: 'InlineAd' }));
