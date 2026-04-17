function requireEnv(name: string, value: string | undefined) {
  const resolvedValue = value;

  if (typeof resolvedValue !== 'string' || resolvedValue.length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return resolvedValue;
}

function resolveEnv(
  preferredName: string,
  preferredValue: string | undefined,
  fallbackName: string,
  fallbackValue: string | undefined,
) {
  return requireEnv(preferredName, preferredValue ?? fallbackValue);
}

export function getPublicEnv() {
  return {
    supabaseUrl: requireEnv('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabasePublishableKey: resolveEnv(
      'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
  };
}

export function getServerEnv() {
  return {
    ...getPublicEnv(),
    supabaseSecretKey: resolveEnv(
      'SUPABASE_SECRET_KEY',
      process.env.SUPABASE_SECRET_KEY,
      'SUPABASE_SERVICE_ROLE_KEY',
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    ),
  };
}

export function getExternalApiEnv() {
  return {
    naverClientId: requireEnv('NAVER_CLIENT_ID', process.env.NAVER_CLIENT_ID),
    naverClientSecret: requireEnv(
      'NAVER_CLIENT_SECRET',
      process.env.NAVER_CLIENT_SECRET,
    ),
    youtubeApiKey: requireEnv('YOUTUBE_API_KEY', process.env.YOUTUBE_API_KEY),
    kmaServiceKey: requireEnv('KMA_SERVICE_KEY', process.env.KMA_SERVICE_KEY),
  };
}

export function getCronSecret() {
  return requireEnv('CRON_SECRET', process.env.CRON_SECRET);
}
