# 꽃 어디 어드민 + 데이터베이스 설계

## 1. 목표

- 꽃 종류와 꽃 명소 데이터를 운영할 수 있는 어드민을 구축한다.
- 운영자는 수동 입력과 AI 생성 JSON 붙여넣기 방식으로 데이터를 등록할 수 있어야 한다.
- 모바일 앱은 공개된 명소 데이터만 읽고, 화면용 문구는 조회 계층에서 가공한다.

## 2. 이번 범위

### 포함

- `apps/admin`에 Next.js App Router 기반 어드민 구축
- Supabase Postgres 기반 `flowers`, `spots` 스키마 정의
- 단일 관리자 로그인
- 꽃 마스터 CRUD
- 명소 CRUD
- JSON 단건 등록과 JSON 일괄 등록
- 대표 이미지 URL 입력 및 업로드 후 URL 저장
- `draft -> published` 공개 흐름

### 제외

- 다중 관리자 권한 체계
- 사용자 업로드 검수
- 복수 꽃과 하나의 명소를 연결하는 다대다 모델
- 이미지 변환 파이프라인 고도화
- 통계 대시보드

## 3. 제품 원칙

- 꽃 종류는 코드에 하드코딩하지 않고 `flowers` 테이블 기준으로 관리한다.
- 명소는 하나의 대표 꽃에 연결한다.
- AI가 생성한 JSON은 운영 보조 수단이며, 최종 공개 전에는 관리자가 검토한다.
- 공개 상태가 아닌 데이터는 모바일에서 노출되지 않는다.
- 화면용 배지나 상태 문구는 DB에 고정 저장하지 않고 날짜 기준으로 계산한다.

## 4. 기술 방향

- 어드민: Next.js App Router
- 데이터베이스: Supabase Postgres
- 인증: Supabase Auth
- 이미지 저장: Vercel Blob/Object Storage
- 모바일 연동: 초기에는 Supabase 조회 유틸 또는 서버 측 조회 계층으로 대응

## 5. 데이터 모델

### `flowers`

꽃 종류를 관리하는 마스터 테이블.

- `id`: UUID, PK
- `slug`: text, unique, not null
- `name_ko`: text, not null
- `name_en`: text
- `color_hex`: text, not null
- `season_start_month`: smallint, not null
- `season_end_month`: smallint, not null
- `sort_order`: integer, not null default 0
- `is_active`: boolean, not null default true
- `created_at`: timestamptz, not null default now()
- `updated_at`: timestamptz, not null default now()

제약:

- `slug`는 영문 소문자와 하이픈 기준으로 운영
- `season_start_month`, `season_end_month`는 1~12 범위

### `spots`

실제 명소와 축제 운영 데이터를 관리하는 테이블.

- `id`: UUID, PK
- `flower_id`: UUID, FK -> `flowers.id`, not null
- `slug`: text, unique, not null
- `name`: text, not null
- `region_primary`: text, not null
- `region_secondary`: text, not null
- `address`: text, not null
- `latitude`: numeric(9,6), not null
- `longitude`: numeric(9,6), not null
- `description`: text, not null
- `short_tip`: text, not null
- `parking_info`: text
- `admission_fee`: text
- `festival_name`: text
- `festival_start_at`: date
- `festival_end_at`: date
- `bloom_start_at`: date, not null
- `bloom_end_at`: date, not null
- `thumbnail_url`: text
- `status`: text, not null default `'draft'`
- `source_type`: text, not null default `'manual_json'`
- `source_note`: text
- `is_featured`: boolean, not null default false
- `display_order`: integer, not null default 0
- `created_at`: timestamptz, not null default now()
- `updated_at`: timestamptz, not null default now()

제약:

- `status`는 `draft`, `published`만 허용
- `bloom_start_at <= bloom_end_at`
- 축제 날짜가 있으면 `festival_start_at <= festival_end_at`
- 위도/경도는 유효 범위 내 값만 허용

## 6. JSON 인입 설계

어드민은 두 가지 입력 방식을 모두 지원한다.

1. 꽃 1종 + 명소 여러 개 일괄 등록
2. 기존 꽃에 명소 1건 단건 등록

### 권장 일괄 등록 포맷

```json
{
  "flower": {
    "slug": "cherry-blossom",
    "name_ko": "벚꽃",
    "name_en": "Cherry Blossom",
    "color_hex": "#F6B7C1",
    "season_start_month": 3,
    "season_end_month": 4,
    "sort_order": 1,
    "is_active": true
  },
  "spots": [
    {
      "slug": "yeouido-yunjung-ro",
      "name": "여의도 윤중로",
      "region_primary": "서울/경기",
      "region_secondary": "서울 영등포구",
      "address": "서울특별시 영등포구 여의서로 일대",
      "latitude": 37.5259,
      "longitude": 126.9226,
      "description": "한강 바람을 따라 걷기 좋은 서울 대표 벚꽃 산책 코스",
      "short_tip": "산책 동선이 좋고 축제 분위기가 살아 있는 대표 스팟",
      "parking_info": "인근 공영주차장 이용 권장",
      "admission_fee": "무료",
      "festival_name": "영등포 여의도 봄꽃축제",
      "festival_start_at": "2026-04-01",
      "festival_end_at": "2026-04-07",
      "bloom_start_at": "2026-03-28",
      "bloom_end_at": "2026-04-10",
      "thumbnail_url": "https://example.com/yeouido.jpg",
      "status": "draft",
      "source_note": "AI 수집 초안"
    }
  ]
}
```

### 권장 단건 등록 포맷

```json
{
  "flower_slug": "cherry-blossom",
  "spot": {
    "slug": "yeouido-yunjung-ro",
    "name": "여의도 윤중로",
    "region_primary": "서울/경기",
    "region_secondary": "서울 영등포구",
    "address": "서울특별시 영등포구 여의서로 일대",
    "latitude": 37.5259,
    "longitude": 126.9226,
    "description": "한강 바람을 따라 걷기 좋은 서울 대표 벚꽃 산책 코스",
    "short_tip": "산책 동선이 좋고 축제 분위기가 살아 있는 대표 스팟",
    "parking_info": "인근 공영주차장 이용 권장",
    "admission_fee": "무료",
    "festival_name": "영등포 여의도 봄꽃축제",
    "festival_start_at": "2026-04-01",
    "festival_end_at": "2026-04-07",
    "bloom_start_at": "2026-03-28",
    "bloom_end_at": "2026-04-10",
    "thumbnail_url": "https://example.com/yeouido.jpg",
    "status": "draft",
    "source_note": "AI 수집 초안"
  }
}
```

### 인입 규칙

- `status`가 없으면 기본값은 `draft`
- 날짜는 `YYYY-MM-DD`
- `flower.slug`가 이미 있으면 꽃은 새로 만들지 않고 기존 꽃을 사용
- `spot.slug`가 이미 있으면 신규 생성이 아니라 업데이트 후보로 표시
- `thumbnail_url`가 비어 있어도 저장은 가능하지만 공개 전 경고 표시
- 위도/경도가 없으면 저장 불가
- `flower_slug`도 없고 `flower` 객체도 없으면 저장 불가

## 7. 어드민 화면 설계

### 7.1 로그인

- Supabase Auth 이메일/비밀번호 로그인
- 초기에는 단일 관리자 계정만 사용

### 7.2 꽃 목록

- 컬럼: 꽃 이름, slug, 시즌, 정렬, 활성화 여부
- 액션: 생성, 수정, 비활성화
- 목적: 필터 노출용 마스터 관리

### 7.3 명소 목록

- 컬럼: 썸네일, 명소명, 꽃 종류, 지역, 상태, 수정일
- 검색: 명소명, 지역
- 필터: 꽃 종류, 상태, 지역
- 액션: 수정, 공개, 비공개

### 7.4 명소 등록/수정

- 일반 폼 입력 지원
- 대표 이미지 URL 직접 입력 지원
- 대표 이미지 업로드 지원
- 저장 기본값은 `draft`

### 7.5 JSON 일괄 등록

- JSON 붙여넣기 입력창
- `검증` 버튼
- 검증 결과 요약
- 저장 전 미리보기
- `일괄 저장` 버튼

## 8. Import / Preview 흐름

### 단건 입력

1. 관리자가 폼에서 명소를 직접 작성
2. 이미지 업로드 시 Vercel Blob에 업로드하고 URL 저장
3. 저장 시 `draft`
4. 검토 후 `published` 전환

### JSON 입력

1. 관리자가 AI가 생성한 JSON을 붙여넣음
2. JSON schema 검증 수행
3. 꽃 존재 여부와 명소 slug 중복 여부 확인
4. 결과를 아래 세 그룹으로 분류해 표시
   - 새로 생성될 항목
   - 기존 데이터 업데이트 항목
   - 오류로 저장 불가한 항목
5. 확인 후 저장
6. 저장 결과는 기본적으로 `draft`

## 9. 이미지 처리

- 폼 등록 화면에서는 파일 업로드를 지원한다.
- 업로드 파일은 Vercel Blob/Object Storage에 저장한다.
- 저장된 URL을 `spots.thumbnail_url`에 기록한다.
- JSON 등록은 기본적으로 `thumbnail_url`을 받는다.
- JSON 등록 후 개별 명소 수정 화면에서 이미지 업로드로 교체할 수 있다.

## 10. 공개 흐름

- 생성 또는 JSON 저장 시 기본 상태는 `draft`
- 명소 상세 검토 후 `published`로 전환
- 모바일은 `published`만 조회
- 운영 초반에는 하드 삭제보다 `draft` 되돌리기 중심으로 운영
- `published` 전환 전에는 대표 이미지, 좌표, 꽃 연결, 개화 기간 존재 여부를 점검한다.
- 한 번 공개된 명소의 `slug`는 가급적 변경하지 않는다.

## 11. 모바일 연동 규칙

- 모바일은 `published` 상태의 `spots`만 조회한다.
- 꽃 필터는 `flowers.is_active = true`만 노출한다.
- 화면용 문구는 조회 계층에서 계산한다.

### 조회 시 계산하는 값

- `festivalDate`: `festival_start_at` + `festival_end_at`
- `location`: `region_secondary` 또는 주소 요약
- `badge`: `is_featured`와 날짜 조건을 조합해 계산
- `bloomStatus`: 오늘 날짜와 `bloom_start_at`, `bloom_end_at` 비교로 계산
- `eventEndsIn`: `festival_end_at` 기준 D-day 계산

### 권장 조회 단위

- `GET /flowers`
- `GET /spots`
- `GET /spots/:slug`
- `GET /home-feed`

초기에는 별도 복잡한 백엔드보다 Supabase 조회 유틸 또는 서버 측 가공 레이어로 충분하다.

## 12. 검증과 경고 규칙

### 저장 불가

- 필수값 누락
- 위도/경도 형식 오류
- 날짜 형식 오류
- 꽃 식별 정보 없음

### 경고 후 저장 가능

- 대표 이미지 없음
- 축제 날짜와 개화 날짜의 맥락이 어색함
- 같은 이름인데 slug가 다른 유사 데이터 존재
- 이미 `published` 상태인 데이터를 JSON으로 덮어쓰려는 경우

## 13. 테스트 전략

### 어드민

- JSON schema 검증 테스트
- 중복 slug 처리 테스트
- `draft` 기본 저장 테스트
- `published` 전환 테스트
- 이미지 URL 저장 테스트

### 조회 계층

- `bloomStatus` 계산 테스트
- `eventEndsIn` 계산 테스트
- 홈 피드 정렬 테스트
- `draft` 제외 테스트

## 14. 구현 순서

1. Supabase 스키마 생성
2. `apps/admin` 스캐폴딩
3. 관리자 로그인
4. 꽃/명소 CRUD
5. JSON import + validation + preview
6. 이미지 업로드 연동
7. 모바일 목업 데이터를 실제 조회 계층으로 교체

## 15. 결정 사항 요약

- 운영 범위는 `flowers + spots`
- 데이터 입력은 수동 입력 중심
- AI가 만든 JSON을 어드민에 붙여넣는 방식 지원
- 단건 등록과 배열 일괄 등록 모두 지원
- 대표 이미지는 URL 입력과 업로드 모두 지원
- 공개 흐름은 `draft -> published`
- 인증은 단일 관리자 로그인
- DB와 인증은 Supabase 기반
