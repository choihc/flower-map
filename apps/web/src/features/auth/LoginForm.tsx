'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { sanitizeRedirectTarget } from '@/lib/auth/redirect';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';

type LoginFormProps = {
  redirectTo?: string;
};

export function LoginForm({ redirectTo = '/admin/spots' }: LoginFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const safeRedirectTo = sanitizeRedirectTarget(redirectTo);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setErrorMessage(null);

    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: String(formData.get('email') ?? ''),
      password: String(formData.get('password') ?? ''),
    });

    setIsSubmitting(false);

    if (error != null) {
      setErrorMessage(error.message);
      return;
    }

    router.replace(safeRedirectTo);
    router.refresh();
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          이메일
        </label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          비밀번호
        </label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {errorMessage ? (
        <p role="alert" className="rounded-2xl border border-[#F5C2C7] bg-[#FDECEC] px-4 py-3 text-sm text-[#C6282D]">
          {errorMessage}
        </p>
      ) : null}
      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? '로그인 중...' : '로그인'}
      </Button>
    </form>
  );
}
