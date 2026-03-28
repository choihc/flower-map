/**
 * 어드민 계정 생성 스크립트
 * 실행: pnpm create-admin
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

const ADMIN_EMAIL = 'nextvine.flow@gmail.com';
const ADMIN_PASSWORD = 'K0=?:1qp7E%#P>DHd5U?';

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  console.error('   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY 를 확인해주세요.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function createAdmin() {
  console.log(`\n어드민 계정 생성 중: ${ADMIN_EMAIL}`);

  // 1. auth.users 에 계정 생성
  const { data: userData, error: createError } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
  });

  if (createError) {
    if (createError.message.includes('already been registered')) {
      console.log('ℹ️  이미 가입된 계정입니다. admin_users 등록 여부를 확인합니다.');

      const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) throw listError;

      const existing = listData.users.find((u) => u.email === ADMIN_EMAIL);
      if (!existing) throw new Error('유저를 찾을 수 없습니다.');

      await grantAdminRole(existing.id);
      return;
    }
    throw createError;
  }

  console.log(`✅ 계정 생성 완료 (id: ${userData.user.id})`);

  // 2. admin_users 테이블에 등록
  await grantAdminRole(userData.user.id);
}

async function grantAdminRole(userId: string) {
  const { error } = await supabase.from('admin_users').upsert(
    { user_id: userId, note: '초기 어드민 계정' },
    { onConflict: 'user_id' },
  );

  if (error) throw error;

  console.log(`✅ admin_users 등록 완료`);
  console.log(`\n로그인 정보:`);
  console.log(`  이메일: ${ADMIN_EMAIL}`);
  console.log(`  비밀번호: ${ADMIN_PASSWORD}`);
}

createAdmin().catch((err) => {
  console.error('❌ 오류 발생:', err.message);
  process.exit(1);
});
