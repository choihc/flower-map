const PUBLIC_ENV_KEYS = {
  supabaseUrl: 'NEXT_PUBLIC_SUPABASE_URL',
  supabaseAnonKey: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
} as const;

const SERVER_ENV_KEYS = {
  supabaseServiceRoleKey: 'SUPABASE_SERVICE_ROLE_KEY',
} as const;

function requireEnv(name: string) {
  const value = process.env[name];

  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getPublicEnv() {
  return {
    supabaseUrl: requireEnv(PUBLIC_ENV_KEYS.supabaseUrl),
    supabaseAnonKey: requireEnv(PUBLIC_ENV_KEYS.supabaseAnonKey),
  };
}

export function getServerEnv() {
  return {
    ...getPublicEnv(),
    supabaseServiceRoleKey: requireEnv(SERVER_ENV_KEYS.supabaseServiceRoleKey),
  };
}
