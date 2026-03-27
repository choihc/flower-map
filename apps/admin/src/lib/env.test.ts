import { afterEach, describe, expect, it, vi } from 'vitest';

import { getPublicEnv, getServerEnv } from './env';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('getPublicEnv', () => {
  it('prefers the publishable key when both modern and legacy public keys are present', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_modern');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'sb_anon_legacy');

    expect(getPublicEnv()).toEqual({
      supabaseUrl: 'https://example.supabase.co',
      supabasePublishableKey: 'sb_publishable_modern',
    });
  });

  it('falls back to the legacy anon key when the publishable key is absent', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'sb_anon_legacy');

    expect(getPublicEnv()).toEqual({
      supabaseUrl: 'https://example.supabase.co',
      supabasePublishableKey: 'sb_anon_legacy',
    });
  });
});

describe('getServerEnv', () => {
  it('prefers the secret key when both modern and legacy server keys are present', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_modern');
    vi.stubEnv('SUPABASE_SECRET_KEY', 'sb_secret_modern');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service_role_legacy');

    expect(getServerEnv()).toEqual({
      supabaseUrl: 'https://example.supabase.co',
      supabasePublishableKey: 'sb_publishable_modern',
      supabaseSecretKey: 'sb_secret_modern',
    });
  });

  it('falls back to the legacy service role key when the secret key is absent', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_modern');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service_role_legacy');

    expect(getServerEnv()).toEqual({
      supabaseUrl: 'https://example.supabase.co',
      supabasePublishableKey: 'sb_publishable_modern',
      supabaseSecretKey: 'service_role_legacy',
    });
  });
});
