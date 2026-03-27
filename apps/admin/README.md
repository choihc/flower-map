# Admin App

꽃 데이터와 명소 데이터를 관리하는 Next.js 어드민입니다.

## Overview

현재 어드민은 Toss-inspired 운영 화면을 목표로 구성되어 있습니다.

- 공통 `DashboardShell` 안에서 사이드바 네비게이션과 상단 컨텍스트를 함께 제공합니다.
- `/`는 KPI-first 대시보드 홈으로, 전체 운영 현황과 최근 명소를 빠르게 확인합니다.
- `/flowers`와 `/spots`는 각각 구조화된 CRUD 워크스페이스로 분리되어 있습니다.
- `/spots/import`는 JSON 편집기와 결과 요약 패널로 구성된 import 작업면입니다.
- 로그인 화면은 두 열 인증 레이아웃으로, redirect 흐름을 유지한 채 진입점을 제공합니다.

## Navigation

- `/` dashboard home
- `/flowers` 꽃 관리
- `/spots` 명소 관리
- `/spots/import` JSON 등록
- `/settings` settings placeholder

## Local setup

1. `apps/admin/.env.example`을 참고해서 `apps/admin/.env.local`을 만듭니다.
2. Supabase 프로젝트에서 아래 값을 채웁니다.
3. `pnpm dev` 또는 `pnpm build`로 연결을 확인합니다.

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxxxxxxxxxx
SUPABASE_SECRET_KEY=sb_secret_xxxxxxxxxxxxxxxxxxxx
```

최신 Supabase 키 이름을 우선 사용하고, 기존 `NEXT_PUBLIC_SUPABASE_ANON_KEY`와 `SUPABASE_SERVICE_ROLE_KEY`도 임시 fallback으로 지원합니다.

## Key Workspaces

- Supabase Auth 기반 관리자 로그인
- `public.admin_users` 기반 uid 단위 관리자 권한 제어
- Toss-inspired dashboard shell and sidebar navigation
- KPI-first dashboard home with recent status summary
- Structured flower and spot management panels
- JSON import workspace with validation and draft-save summary

## Notes

- JSON import keeps validation and save behavior wired through the current server action contract.
- Flower and spot saves remain server-action driven and revalidate the dashboard summaries.
- 이미지 업로드 API 계약은 유지됩니다.
- 관리자 권한 부여는 가입 후 아래 SQL로 진행합니다.

```sql
insert into public.admin_users (user_id, note)
values ('YOUR_AUTH_USER_ID', 'initial admin')
on conflict (user_id) do nothing;
```
