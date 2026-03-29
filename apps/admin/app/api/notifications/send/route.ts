import { NextResponse } from 'next/server';

import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { sendEasPushNotifications } from '@/lib/notifications/easPushClient';

export async function POST(request: Request) {
  const body = (await request.json()) as { title?: string; body?: string };

  if (!body.title?.trim() || !body.body?.trim()) {
    return NextResponse.json({ error: '제목과 내용을 입력해주세요.' }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();
  const { data: rows, error } = await supabase
    .from('push_tokens')
    .select('token');

  if (error) {
    return NextResponse.json({ error: 'DB 조회 실패' }, { status: 500 });
  }

  const tokens = (rows ?? []).map((r) => r.token);
  const accessToken = process.env.EXPO_ACCESS_TOKEN;

  const result = await sendEasPushNotifications(tokens, body.title, body.body, accessToken);

  return NextResponse.json({
    ...result,
    totalTokens: tokens.length,
  });
}
