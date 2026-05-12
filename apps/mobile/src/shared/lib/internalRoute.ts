/**
 * 앱 내부 라우트 패스만 허용한다. DB `home_curation.cta_route` check 제약
 * (`^/([a-zA-Z0-9_-]+(/[a-zA-Z0-9_-]+)*)?$`) 과 정렬하되, 루트 `/` 단독은
 * expo-router 라우트 트리에 `app/index`가 없어 비결정적 진입을 만들 수 있어
 * 클라이언트에서는 추가로 차단한다. 외부 URL/스킴(`https://`, `javascript:`)
 * 및 프로토콜 상대(`//evil`)도 함께 막는다.
 */
const INTERNAL_ROUTE_PATTERN = /^\/[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*$/;

export function isInternalAppRoute(route: unknown): route is string {
  return typeof route === 'string' && INTERNAL_ROUTE_PATTERN.test(route);
}
