import React from 'react';
import { redirect } from 'next/navigation';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from '@/features/auth/LoginForm';
import { getAdminAccessState } from '@/lib/auth/admin';
import { sanitizeRedirectTarget } from '@/lib/auth/redirect';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type LoginPageProps = {
  searchParams?: Promise<{ redirectTo?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const supabase = await createServerSupabaseClient();
  const { isAdmin, user } = await getAdminAccessState(supabase as never);

  const resolvedSearchParams = searchParams == null ? {} : await searchParams;
  const redirectToParam = Array.isArray(resolvedSearchParams.redirectTo)
    ? resolvedSearchParams.redirectTo[0]
    : resolvedSearchParams.redirectTo;
  const redirectTo = sanitizeRedirectTarget(redirectToParam);

  if (user != null && isAdmin) {
    redirect(redirectTo);
  }

  return (
    <main className="min-h-screen bg-background px-4 py-4 lg:px-6 lg:py-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1440px] gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,520px)]">
        <section className="rounded-[32px] border border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(248,250,252,0.9))] p-8 shadow-[0_12px_40px_rgba(15,23,42,0.04)] lg:p-12">
          <div className="flex h-full flex-col justify-between gap-10">
            <div className="space-y-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Flower Map Admin</p>
              <div className="space-y-4">
                <h1 className="max-w-xl text-4xl font-semibold tracking-[-0.04em] text-foreground lg:text-6xl">
                  운영에 필요한 꽃과 명소를 한 화면에서 다룹니다.
                </h1>
                <p className="max-w-xl text-base leading-7 text-muted-foreground lg:text-lg">
                  Supabase Auth 계정으로 로그인한 뒤 draft 검수, JSON 등록, 시즌 관리, 공개 상태 전환까지 이어서 작업하실 수 있습니다.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl border border-border bg-background px-4 py-4">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Dashboard</p>
                <p className="mt-2 text-sm text-foreground">명확한 KPI와 운영 흐름</p>
              </div>
              <div className="rounded-3xl border border-border bg-background px-4 py-4">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Workspace</p>
                <p className="mt-2 text-sm text-foreground">꽃, 명소, JSON을 분리된 작업면으로</p>
              </div>
              <div className="rounded-3xl border border-border bg-background px-4 py-4">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Access</p>
                <p className="mt-2 text-sm text-foreground">redirectTo를 유지한 안전한 이동</p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center">
          <Card className="w-full overflow-hidden">
            <CardHeader className="px-6 py-6">
              <CardTitle>관리자 로그인</CardTitle>
              <CardDescription>Supabase Auth 계정으로 로그인한 뒤 바로 관리 화면으로 이동합니다.</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <LoginForm redirectTo={redirectTo} />
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
