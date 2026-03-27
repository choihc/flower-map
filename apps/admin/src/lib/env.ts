function requireEnv(name: string, value: string | undefined) {
  const resolvedValue = value;

  if (typeof resolvedValue !== 'string' || resolvedValue.length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return resolvedValue;
}

export function getPublicEnv() {
  return {
    supabaseUrl: requireEnv('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseAnonKey: requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  };
}

export function getServerEnv() {
  return {
    ...getPublicEnv(),
    supabaseServiceRoleKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY),
  };
}
