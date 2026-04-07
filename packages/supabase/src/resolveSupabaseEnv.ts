type EnvSource = Record<string, string | undefined> | undefined;

export const DEFAULT_SUPABASE_URL = 'https://ktmykdcmknaqsomzeank.supabase.co';
export const DEFAULT_SUPABASE_PUBLISHABLE_KEY =
  'sb_publishable__TfGxnQaNqCg96SKwTUCCA_5vrI-SKE';

export function resolveSupabaseEnv(importMetaEnv: EnvSource, processEnv: EnvSource) {
  const supabaseUrl =
    importMetaEnv?.EXPO_PUBLIC_SUPABASE_URL ??
    processEnv?.SUPABASE_URL ??
    processEnv?.EXPO_PUBLIC_SUPABASE_URL ??
    DEFAULT_SUPABASE_URL;

  const supabaseKey =
    importMetaEnv?.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    processEnv?.SUPABASE_PUBLISHABLE_KEY ??
    processEnv?.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    DEFAULT_SUPABASE_PUBLISHABLE_KEY;

  return {
    supabaseUrl,
    supabaseKey,
  };
}
