/**
 * 호캉스(stays) 경로 상수와 매칭 유틸리티.
 *
 * Critical-B1 후속: 다른 도메인/레이어에서 호캉스 경로를 다룰 때 문자열 리터럴을
 * 흩뿌리지 않도록 단일 출처를 둔다. `isStaysRoute`는 단순 prefix가 아닌 정확한
 * 경계 매칭을 보장한다 (`/stays-foo`나 `/staysfoo`는 매칭되지 않음).
 */
export const STAYS_ROUTE = '/stays' as const;

export function isStaysRoute(path: string): boolean {
  return path === STAYS_ROUTE || path.startsWith(`${STAYS_ROUTE}/`);
}

export function staysDetailPath(slug: string) {
  return `${STAYS_ROUTE}/${slug}` as const;
}
