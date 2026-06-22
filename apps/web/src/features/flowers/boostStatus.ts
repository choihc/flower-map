/**
 * 꽃 집중 노출(Boost) 상태 판정 헬퍼 (FR-2-1, FR-2-2)
 *
 * boostStatus(flower, now) → { kind, label }
 *   kind:
 *     'active'    — 오늘이 부스트 기간 안에 있음 (시작 <= 오늘 <= 종료)
 *     'scheduled' — 부스트가 설정됐으나 시작일이 아직 도래하지 않음
 *     'expired'   — 종료일이 지남
 *     'none'      — 부스트 미설정
 */

type BoostFlower = {
  boost_start_at: string | null;
  boost_end_at: string | null;
};

export type BoostStatusResult = {
  kind: 'active' | 'scheduled' | 'expired' | 'none';
  label: string;
};

/** 'YYYY-MM-DD' 문자열로 변환 (KST 기준 now 사용) */
function toDateStr(date: Date): string {
  // KST = UTC+9
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

/** 두 'YYYY-MM-DD' 문자열 간의 일수 차이 (end - start) */
function daysBetween(startStr: string, endStr: string): number {
  const start = new Date(`${startStr}T00:00:00Z`);
  const end = new Date(`${endStr}T00:00:00Z`);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export function boostStatus(flower: BoostFlower, now: Date = new Date()): BoostStatusResult {
  const { boost_start_at: s, boost_end_at: e } = flower;

  // 미설정
  if (s === null || e === null) {
    return { kind: 'none', label: '' };
  }

  const today = toDateStr(now);

  // active: start <= today <= end
  if (s <= today && today <= e) {
    const remaining = daysBetween(today, e);
    return { kind: 'active', label: `집중 노출 중 D-${remaining}` };
  }

  // scheduled: today < start
  if (today < s) {
    const mm = s.slice(5, 7);
    const dd = s.slice(8, 10);
    return { kind: 'scheduled', label: `예약 ${mm}.${dd}~` };
  }

  // expired: end < today
  return { kind: 'expired', label: '만료' };
}
