import { redirect } from 'next/navigation';

import { LoginForm } from '@/features/auth/LoginForm';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type LoginPageProps = {
  searchParams?: Promise<{ redirectTo?: string | string[] }> | { redirectTo?: string | string[] };
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const resolvedSearchParams = searchParams == null ? {} : await searchParams;
  const redirectTo = Array.isArray(resolvedSearchParams.redirectTo)
    ? resolvedSearchParams.redirectTo[0]
    : resolvedSearchParams.redirectTo;

  if (user != null) {
    redirect(redirectTo ?? '/spots');
  }

  return (
    <main>
      <h1>관리자 로그인</h1>
      <p>Supabase Auth 계정으로 로그인한 뒤 꽃과 명소 초안을 관리합니다.</p>
      <LoginForm redirectTo={redirectTo ?? '/spots'} />
    </main>
  );
}
