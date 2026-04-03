import { createClient } from '@supabase/supabase-js';

declare const process:
  | {
      env: Record<string, string | undefined>;
    }
  | undefined;

// Granite는 import.meta.env → global.__granite.meta.env 로 babel 변환 후
// 폴리필로 값을 주입합니다. Expo는 process.env EXPO_PUBLIC_*, Node는 process.env 를 사용합니다.
declare const global: {
  __granite?: { meta?: { env?: Record<string, string | undefined> } };
} & Record<string, unknown>;

const graniteEnv =
  typeof global !== 'undefined' ? global.__granite?.meta?.env : undefined;

const supabaseUrl =
  graniteEnv?.EXPO_PUBLIC_SUPABASE_URL ??
  (typeof process === 'undefined' ? undefined : process.env.SUPABASE_URL) ??
  (typeof process === 'undefined'
    ? undefined
    : process.env.EXPO_PUBLIC_SUPABASE_URL);

const supabaseKey =
  graniteEnv?.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  (typeof process === 'undefined'
    ? undefined
    : process.env.SUPABASE_PUBLISHABLE_KEY) ??
  (typeof process === 'undefined'
    ? undefined
    : process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Supabase 환경 변수가 필요합니다: SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY 또는 EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
