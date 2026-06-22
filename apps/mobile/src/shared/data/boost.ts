/**
 * 꽃 집중 노출(Boost) 판정 및 정렬 헬퍼
 * FR-3, FR-4 (flower-boost-exposure-spec.md §3.2, §7.3)
 */

/**
 * KST(Asia/Seoul, UTC+9) 기준 오늘 날짜를 'YYYY-MM-DD' 형식으로 반환한다.
 * NFR-5: 기존 bloom D-day 계산과 동일한 날짜 경계 규칙.
 */
export function kstToday(now = new Date()): string {
  // UTC ms + 9시간 오프셋으로 KST Date 생성 후 ISO 문자열에서 날짜 부분만 추출
  const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
  const kstDate = new Date(now.getTime() + KST_OFFSET_MS);
  return kstDate.toISOString().slice(0, 10);
}

/**
 * §3.2 규칙: isBoosted(f, today) :=
 *   f.boost_start_at IS NOT NULL
 *   AND f.boost_end_at IS NOT NULL
 *   AND f.boost_start_at <= today
 *   AND today <= f.boost_end_at
 */
export function isActiveBoost(
  flower: { boost_start_at: string | null; boost_end_at: string | null },
  now = new Date(),
): boolean {
  const { boost_start_at, boost_end_at } = flower;
  if (boost_start_at == null || boost_end_at == null) return false;
  const today = kstToday(now);
  return boost_start_at <= today && today <= boost_end_at;
}

/**
 * 부스트 우선 비교자 팩토리 (FR-4, §7.3)
 * 1차: isBoosted(true 먼저)
 * 2차: base(a, b) — 화면 기존 정렬 기준
 * 안정 정렬 보장.
 */
export function boostFirst<T extends { isBoosted: boolean }>(
  base: (a: T, b: T) => number,
): (a: T, b: T) => number {
  return (a, b) => {
    if (a.isBoosted !== b.isBoosted) return a.isBoosted ? -1 : 1;
    return base(a, b);
  };
}
