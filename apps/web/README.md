# Web App

꽃 어디의 공개 웹과 `/admin` 운영 화면을 함께 제공하는 Next.js 메인 웹 앱입니다.

## Overview

현재 `apps/web`은 공개 사용자 웹을 기본 진입점으로 두고, 운영 기능은 `/admin` 하위 경로로 분리하는 구조로 구성되어 있습니다.

- 공개 영역은 `/`, `/map`, `/search`, `/spot/[slug]`, `/support`, `/privacy`로 확장됩니다.
- 공개 화면은 토스 인앱 웹뷰 유입을 고려한 모바일 우선 구조를 기준으로 구성합니다.
- 관리자 영역은 `/admin` 아래에서 `DashboardShell` 기반 운영 화면으로 분리됩니다.
- `/admin/flowers`와 `/admin/spots`는 각각 구조화된 CRUD 워크스페이스로 구성됩니다.
- `/admin/spots/import`는 JSON 편집기와 결과 요약 패널로 구성된 import 작업면입니다.
- 로그인 화면은 두 열 인증 레이아웃으로, redirect 흐름을 유지한 채 진입점을 제공합니다.

## Navigation

- `/` 공개 랜딩
- `/map` 공개 지도 탐색
- `/search` 공개 명소 탐색
- `/spot/[slug]` 공개 명소 상세
- `/admin` 관리자 대시보드
- `/admin/flowers` 꽃 관리
- `/admin/spots` 명소 관리
- `/admin/spots/import` JSON 등록
- `/admin/settings` 설정 placeholder

## Local setup

1. `apps/web/.env.example`을 참고해서 `apps/web/.env.local`을 만듭니다.
2. Supabase 프로젝트에서 아래 값을 채웁니다.
3. `pnpm dev` 또는 `pnpm build`로 연결을 확인합니다.

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxxxxxxxxxx
SUPABASE_SECRET_KEY=sb_secret_xxxxxxxxxxxxxxxxxxxx
```

최신 Supabase 키 이름을 우선 사용하고, 기존 `NEXT_PUBLIC_SUPABASE_ANON_KEY`와 `SUPABASE_SERVICE_ROLE_KEY`도 임시 fallback으로 지원합니다.

## Key Workspaces

- 비로그인 공개 웹 진입점
- 토스 인앱 웹뷰 친화 공개 화면
- Supabase Auth 기반 관리자 로그인
- `public.admin_users` 기반 uid 단위 관리자 권한 제어
- Toss-inspired dashboard shell and sidebar navigation
- KPI-first dashboard home with recent status summary
- Structured flower and spot management panels
- JSON import workspace with validation and draft-save summary

## Notes

- `apps/web`은 현재 저장소의 메인 웹 앱 역할을 맡습니다.
- 관리자 기능은 `/admin` 경로 하위에서만 보호됩니다.
- JSON import keeps validation and save behavior wired through the current server action contract.
- Flower and spot saves remain server-action driven and revalidate the dashboard summaries.
- 이미지 업로드 API 계약은 유지됩니다.
- 관리자 권한 부여는 가입 후 아래 SQL로 진행합니다.

```sql
insert into public.admin_users (user_id, note)
values ('YOUR_AUTH_USER_ID', 'initial admin')
on conflict (user_id) do nothing;
```
