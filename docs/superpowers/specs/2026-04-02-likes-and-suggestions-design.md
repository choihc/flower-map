# 좋아요 & 명소 추천 기능 설계

## 개요

두 가지 사용자 인터랙션 기능을 추가한다:
1. **좋아요**: 기존 "저장하기"를 "좋아요"로 전환하고, 서버 기반 좋아요 수를 표시
2. **명소 추천**: 사용자가 새로운 명소를 추천하고, 어드민이 접수 목록을 확인

## 1. 좋아요 기능

### DB: `spot_likes` 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID, PK | 자동 생성 |
| spot_id | UUID, FK → spots | 명소 참조 |
| device_id | text | 디바이스 고유 식별자 |
| created_at | timestamptz | 생성 시각 |

- unique constraint: `(spot_id, device_id)` — 디바이스당 1회 좋아요

### RLS 정책

- SELECT: anon, authenticated — 좋아요 수 조회
- INSERT: anon, authenticated — 좋아요 등록
- DELETE: device_id가 본인인 경우만 (RPC 또는 device_id 매칭)

### 모바일 변경

- **디바이스 ID**: AsyncStorage에 UUID를 한번 생성하여 영구 저장 (`device_id_v1` 키)
- **LikeButton**: "저장하기/저장됨" → 하트 아이콘 + 좋아요 수 표시 (예: ♡ 123)
- **likeRepository**: AsyncStorage 기반 → Supabase `spot_likes` 테이블 기반으로 전환
  - `toggleSpotLike(spotId, deviceId)`: 좋아요 토글 (있으면 삭제, 없으면 삽입)
  - `isSpotLiked(spotId, deviceId)`: 좋아요 여부 확인
  - `getSpotLikeCount(spotId)`: 좋아요 수 조회
  - `getAllLikedSpotIds(deviceId)`: 내가 좋아요 누른 명소 목록
- **SavedScreen**: 기존 로컬 데이터 대신 서버에서 좋아요 누른 명소 목록 조회
- **SpotDetailScreen**: 좋아요 수 표시

## 2. 명소 추천 기능

### DB: `spot_suggestions` 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID, PK | 자동 생성 |
| name | text, NOT NULL | 명소 이름 (필수) |
| address | text | 위치/주소 (선택) |
| description | text | 추천 이유 (선택) |
| device_id | text | 제출자 식별 |
| created_at | timestamptz | 접수 시각 |

### RLS 정책

- INSERT: anon, authenticated — 누구나 추천 제출 가능
- SELECT: admin_users만 — 어드민 조회 전용

### 모바일

- **SavedScreen 하단**: "알고 계신 명소가 있나요?" 카드 → 누르면 바텀시트 폼
- **폼 필드**: 명소 이름 (필수), 주소 (선택), 추천 이유 (선택)
- **제출 후**: 토스트 메시지 "추천해 주셔서 감사합니다!"

### 어드민

- **사이드바**: "추천 접수" 메뉴 추가
- **목록 페이지**: 테이블 형태로 이름, 주소, 설명, 접수일 표시 (조회 전용, 승인/거절 없음)
