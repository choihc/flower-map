# 꽃 어디 프로젝트 지침

## 앱 배포 체크리스트

### iOS/Android 바이너리 빌드 전 필수 확인

- **버전 번호 확인**: `apps/mobile/app.config.ts`의 `version` 필드가 이전 스토어 승인 버전보다 높은지 반드시 확인할 것
  - 예: 기존 승인 버전이 `1.0.1`이면 `1.0.2` 이상으로 올려야 함
  - Apple은 동일 버전으로 새 빌드 제출 불가 (ITMS-90062)

### EAS Update (OTA) 배포 전 확인

- `runtimeVersion`이 `app.config.ts`에 설정되어 있는지 확인 (`policy: 'appVersion'`)
- OTA 업데이트는 JS/UI 변경에만 사용, 네이티브 변경 시 반드시 새 바이너리 빌드 필요
