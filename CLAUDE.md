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
