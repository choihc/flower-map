import { createClient } from '@supabase/supabase-js';
import { resolveSupabaseEnv } from './resolveSupabaseEnv';

declare const process:
  | {
      env: Record<string, string | undefined>;
    }
  | undefined;

type ImportMetaEnv = {
  env?: Record<string, string | undefined>;
};

const { supabaseUrl, supabaseKey } = resolveSupabaseEnv(
  (import.meta as ImportMetaEnv).env,
  typeof process === 'undefined' ? undefined : process.env,
);

if (!supabaseUrl || !supabaseKey) {
  console.error(
    '[Supabase] 환경 변수 누락: SUPABASE_URL 또는 SUPABASE_PUBLISHABLE_KEY가 없습니다.',
    { supabaseUrl, supabaseKey }
  );
}

export const supabase = createClient(supabaseUrl ?? '', supabaseKey ?? '', {
  // 앱인토스 미니앱은 인증 세션을 쓰지 않으므로 브라우저 저장소/URL 세션 초기화를 끕니다.
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
