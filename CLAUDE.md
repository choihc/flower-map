# 꽃 어디 프로젝트 지침

## 앱 구조 — 반드시 숙지

이 프로젝트에는 **독립적인 두 개의 앱**이 존재한다.

| 앱 | 경로 | 플랫폼 | 빌드 도구 |
|----|------|--------|-----------|
| 일반 앱 | `apps/mobile/` | iOS / Android (Expo) | EAS Build / EAS Update |
| 토스 미니앱 | `apps/toss-mini/` | 토스 앱 내 미니앱 (앱인토스) | `pnpm build` → `.ait` 업로드 |

### 작업 방침

- **두 앱은 서로 영향을 주어서는 안 된다.** 한 앱의 작업이 다른 앱의 동작을 변경하지 않도록 반드시 격리할 것
- `apps/mobile/`을 수정할 때 `apps/toss-mini/`에 영향 없는지 확인, 반대도 마찬가지
- 공유 패키지(`packages/flower-domain`, `packages/supabase`, `packages/storage-adapters`)를 수정할 때는 **두 앱 모두에 미치는 영향**을 검토할 것
  - 단, 현재 `apps/mobile/`은 공유 패키지를 사용하지 않으므로 공유 패키지 변경은 토스 미니앱에만 영향
- 각 앱의 배포 방식이 다르므로 배포 명령어 혼동 주의

## 앱 배포 체크리스트

### iOS/Android 바이너리 빌드 전 필수 확인

- **버전 번호 확인**: `apps/mobile/app.config.ts`의 `version` 필드가 이전 스토어 승인 버전보다 높은지 반드시 확인할 것
  - 예: 기존 승인 버전이 `1.0.1`이면 `1.0.2` 이상으로 올려야 함
  - Apple은 동일 버전으로 새 빌드 제출 불가 (ITMS-90062)

### EAS Update (OTA) 배포 전 확인

- `runtimeVersion`이 `app.config.ts`에 설정되어 있는지 확인 (`policy: 'appVersion'`)
- OTA 업데이트는 JS/UI 변경에만 사용, 네이티브 변경 시 반드시 새 바이너리 빌드 필요

## 꽃/명소 JSON 등록 포맷

어드민 Import 콘솔(`apps/web/src/features/import`)은 **최상위가 단일 객체**인 JSON만 허용하며, 스키마는 `importPayloadSchema`(`apps/web/src/features/import/importSchema.ts`)에 정의되어 있다. 배열(`[ ... ]`) 최상위 포맷은 파싱 실패로 등록되지 않는다.

허용되는 두 가지 포맷:

### 1) 꽃 신규 등록 + 명소 일괄 등록 — `{ flower, spots }`

신규 꽃을 등록하면서 명소를 함께 넣을 때 사용한다. 기존 `docs/import-data/*.json` 파일(예: `cherry-blossom.json`, `tulip.json`)과 동일한 구조.

```json
{
  "flower": {
    "slug": "lilac",
    "name_ko": "라일락",
    "name_en": "Lilac",
    "color_hex": "#B695C0",
    "season_start_month": 4,
    "season_end_month": 5,
    "sort_order": 10,
    "is_active": true
  },
  "spots": [
    { "slug": "...", "name": "...", "...": "..." }
  ]
}
```

### 2) 기존 꽃에 명소 단건 추가 — `{ flower_slug, spot }`

이미 DB에 등록된 꽃에 명소를 **한 건씩** 추가할 때 사용한다. 배열이 아닌 **단일 객체**여야 하므로 여러 건이면 반복 등록할 것.

```json
{
  "flower_slug": "lilac",
  "spot": { "slug": "...", "name": "...", "...": "..." }
}
```

### 작업 시 체크포인트

- 최상위가 배열이면 등록되지 않는다. 여러 명소를 한 번에 넣으려면 포맷 1번(`{ flower, spots: [...] }`)으로 묶을 것.
- `spot` 필수 필드: `slug`, `name`, `region_primary`, `region_secondary`, `address`, `latitude`, `longitude`, `description`, `short_tip`, `bloom_start_at`, `bloom_end_at`. 스키마 상세는 `apps/web/src/features/spots/spotSchema.ts` 참고.
- 신규 꽃 임시/참고용 JSON은 `docs/import-data/<flower-slug>.json`에 저장한다.
