# EAS 푸시 알림 연동 설계

**날짜:** 2026-03-29
**앱:** 꽃 어디 (kkoteodi)
**목적:** 주요 행사 발생 시 전체 사용자에게 푸시 알림을 발송하여 앱 사용을 독려

---

## 1. 목표

- 어드민 패널에서 제목과 내용을 입력하고 버튼 클릭 한 번으로 전체 사용자에게 푸시 알림 발송
- 로그인 여부와 관계없이 앱을 설치한 모든 사용자 대상
- 앱 첫 실행 시 알림 권한 요청

---

## 2. 전체 아키텍처

```
[모바일 앱]
  앱 첫 실행 → 권한 요청 → 푸시 토큰 획득
       ↓
[Supabase] push_tokens 테이블에 upsert
       ↓
[어드민 패널] 알림 발송 UI에서 버튼 클릭
       ↓
[Next.js API Route /api/notifications/send]
  - Supabase에서 전체 토큰 조회
  - 100개씩 청크로 나눠 EAS Push API 배치 발송
       ↓
[EAS Push API (exp.host)] → 각 디바이스로 알림 전달
```

---

## 3. 모바일 앱 (`apps/mobile`)

### 3.1 패키지 추가

```
expo-notifications
expo-device
```

### 3.2 app.json 변경

`plugins` 배열에 `expo-notifications` 플러그인 추가:

```json
["expo-notifications", {
  "icon": "./assets/images/kkkoteodieicon.png",
  "color": "#FFF9F3"
}]
```

iOS `infoPlist`에 권한 설명 문구 추가:
```json
"NSUserNotificationsUsageDescription": "주요 꽃 행사 소식을 알려드리기 위해 알림을 사용합니다."
```

### 3.3 푸시 토큰 수집 로직

위치: `apps/mobile/src/shared/lib/pushNotifications.ts`

- **실기기 여부 확인 필수** (`Device.isDevice`): 시뮬레이터/에뮬레이터에서 `getExpoPushTokenAsync()` 호출 시 크래시 발생하므로 반드시 분기 처리
- `requestPermissionsAsync()`로 권한 요청
- `getExpoPushTokenAsync({ projectId })`로 토큰 획득
- Supabase `push_tokens` 테이블에 upsert (token 기준 중복 방지)

### 3.4 호출 위치

`apps/mobile/app/_layout.tsx` (루트 레이아웃) 마운트 시 1회 실행

---

## 4. Supabase

### 4.1 테이블: `push_tokens`

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | uuid | PK, default gen_random_uuid() | |
| `token` | text | UNIQUE, NOT NULL, CHECK (token LIKE 'ExponentPushToken[%]') | Expo 푸시 토큰 |
| `platform` | text | NOT NULL | `ios` / `android` |
| `user_id` | uuid | nullable, FK → auth.users(id) ON DELETE CASCADE | 추후 타겟 알림 확장 대비 |
| `created_at` | timestamptz | default now() | 최초 등록 시각 |

### 4.2 RLS 정책

- `INSERT`: `anon` 및 `authenticated` role 허용 (앱에서 토큰 저장). CHECK constraint로 유효한 Expo 토큰 형식만 허용하여 스팸 방지
- `SELECT`: `service_role`만 허용 (어드민 API에서만 조회)
- `UPDATE`: 허용 안 함
- `DELETE`: 허용 안 함

---

## 5. 어드민 패널 (`apps/web`)

### 5.1 페이지: `/notifications`

파일: `apps/web/app/(dashboard)/notifications/page.tsx`

UI 요소:
- 알림 제목 입력 (text input)
- 알림 내용 입력 (textarea)
- "발송하기" 버튼
- 발송 결과 표시 (성공/실패 건수)

### 5.2 API Route: `/api/notifications/send`

파일: `apps/web/app/api/notifications/send/route.ts`

처리 흐름:
1. 요청 body에서 `title`, `body` 추출 및 유효성 검사
2. Supabase admin client로 `push_tokens` 전체 조회
3. 토큰 배열을 100개 단위 청크로 분할
4. 각 청크를 EAS Push API (`https://exp.host/--/api/v2/push/send`)에 POST
5. 성공/실패 카운트 집계 후 응답 반환

### 5.3 어드민 사이드바 메뉴 추가

기존 `AdminSidebar`에 "알림 발송" 메뉴 항목 추가

---

## 6. 환경 변수

| 변수 | 위치 | 필수 여부 | 설명 |
|------|------|-----------|------|
| `EXPO_PROJECT_ID` | 모바일 앱 | 선택 | EAS 프로젝트 ID — app.json `extra.eas.projectId`에서 직접 읽어도 무방 |
| `EXPO_ACCESS_TOKEN` | 어드민 `.env.local` | 선택 | Expo 계정 접근 토큰 — 없어도 발송 가능하지만 무료 티어 월별 발송량 제한 완화 목적으로 추가 권장 |

EAS Push API는 인증 없이 호출 가능하나, `EXPO_ACCESS_TOKEN`을 Authorization 헤더에 포함하면 발송 한도가 상향됨

---

## 7. 범위 외 (Out of Scope)

- 사용자별 타겟 알림 (특정 지역, 특정 사용자)
- 알림 발송 이력 저장
- 알림 예약 발송
- 딥링크 (알림 탭 시 특정 화면으로 이동)

---

## 8. 구현 순서

1. Supabase `push_tokens` 테이블 생성 및 RLS 설정
2. 모바일 앱 패키지 설치 및 app.json 수정
3. 모바일 앱 토큰 수집 로직 구현
4. 어드민 API Route 구현
5. 어드민 발송 UI 페이지 구현
6. 어드민 사이드바 메뉴 추가
7. 실기기 테스트 (iOS 실기기 필수 — 시뮬레이터 푸시 불가, Android 에뮬레이터는 Google Play Services 탑재 이미지 필요)
