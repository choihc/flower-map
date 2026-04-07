# Admin Access Control Design

## Goal

Supabase Auth 사용자는 자유롭게 가입할 수 있게 두고, `apps/web` 접근 권한은 별도의 admin 권한 테이블로 제어합니다.

## Design

- `public.admin_users` 테이블을 추가하고 `user_id uuid primary key references auth.users(id)`로 권한을 관리합니다.
- `apps/web`의 서버 레이아웃, 로그인 진입, 미들웨어는 로그인 여부뿐 아니라 `admin_users` 등록 여부를 확인합니다.
- `flowers`, `spots` RLS는 `authenticated` 전체 허용에서 admin 전용으로 강화합니다.
- 실제 권한 부여는 가입 후 SQL로 `admin_users`에 `user_id`를 추가하는 방식으로 운영합니다.

## Success Criteria

- 로그인된 일반 사용자는 `apps/web`에 접근할 수 없습니다.
- `admin_users`에 등록된 사용자만 대시보드 및 데이터 수정 작업을 수행할 수 있습니다.
- 권한 부여는 이메일이 아니라 안정적인 `user_id` 기준으로 관리됩니다.
