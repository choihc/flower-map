import React from 'react';
import { View } from 'react-native';
import { vi } from 'vitest';

export const Storage = {
  getItem: vi.fn(async (_key: string): Promise<string | null> => null),
  setItem: vi.fn(async (_key: string, _value: string): Promise<void> => {}),
  removeItem: vi.fn(async (_key: string): Promise<void> => {}),
};

export const getTossAppVersion = vi.fn(() => '5.254.0');

export const InlineAd = vi.fn(({ adGroupId: _adGroupId, impressFallbackOnMount: _imp, style }: {
  adGroupId: string;
  impressFallbackOnMount?: boolean;
  style?: object;
}) => React.createElement(View, { style, testID: 'InlineAd' }));
