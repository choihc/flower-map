import { describe, expect, it } from 'vitest';

import {
  DEFAULT_SUPABASE_PUBLISHABLE_KEY,
  DEFAULT_SUPABASE_URL,
  resolveSupabaseEnv,
} from '../resolveSupabaseEnv';

describe('resolveSupabaseEnv', () => {
  it('빌드 시점에 주입된 import.meta.env 값을 우선 사용합니다', () => {
    expect(
      resolveSupabaseEnv(
        {
          EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
          EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
        },
        {
          SUPABASE_URL: 'https://fallback.supabase.co',
          SUPABASE_PUBLISHABLE_KEY: 'fallback-key',
        },
      ),
    ).toEqual({
      supabaseUrl: 'https://example.supabase.co',
      supabaseKey: 'publishable-key',
    });
  });

  it('import.meta.env가 없으면 process.env fallback을 사용합니다', () => {
    expect(
      resolveSupabaseEnv(undefined, {
        EXPO_PUBLIC_SUPABASE_URL: 'https://fallback.supabase.co',
        EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'fallback-key',
      }),
    ).toEqual({
      supabaseUrl: 'https://fallback.supabase.co',
      supabaseKey: 'fallback-key',
    });
  });

  it('둘 다 없으면 안전한 공개 fallback 값을 사용합니다', () => {
    expect(resolveSupabaseEnv(undefined, undefined)).toEqual({
      supabaseUrl: DEFAULT_SUPABASE_URL,
      supabaseKey: DEFAULT_SUPABASE_PUBLISHABLE_KEY,
    });
  });
});
