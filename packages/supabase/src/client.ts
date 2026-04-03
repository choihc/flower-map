import { createClient } from '@supabase/supabase-js';

declare const process:
  | {
      env: Record<string, string | undefined>;
    }
  | undefined;

// SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY 형식(일반 Node/서버 환경)과
// EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY 형식(Expo 환경) 모두 지원합니다.
const supabaseUrl =
  (typeof process === 'undefined' ? undefined : process.env.SUPABASE_URL) ??
  (typeof process === 'undefined'
    ? undefined
    : process.env.EXPO_PUBLIC_SUPABASE_URL);

const supabaseKey =
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
