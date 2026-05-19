/**
 * Agoda Partner Search 결과 URL에서 hid를 추출하거나, 숫자만 입력된 경우 그대로 반환한다.
 *
 * 허용 입력:
 * - 전체 URL: "https://www.agoda.com/partners/partnersearch.aspx?pcs=1&cid=1965770&hl=ko-kr&hid=24180119"
 * - 호스트 무관 동일 path: agoda.com 도메인이면 path는 partnersearch.aspx, search.html 등 다양
 * - 숫자 ID 직접: "24180119"
 * - 빈 문자열 / 공백 → null
 * - 잘못된 형식 / hid 없는 URL → null
 *
 * @returns 추출된 hid 문자열 (숫자만 포함, leading zero 없음 보장 X) 또는 null
 */
export function parseAgodaHotelId(input: string | null | undefined): string | null {
  if (input == null) return null;
  const trimmed = input.trim();
  if (trimmed.length === 0) return null;

  // 숫자만 입력: 그대로 반환 (1자 이상)
  if (/^\d+$/.test(trimmed)) return trimmed;

  // URL 파싱 시도
  try {
    const url = new URL(trimmed);
    // agoda 도메인이 아니면 거부 (오입력 방지)
    if (!/(^|\.)agoda\.com$/i.test(url.hostname)) return null;
    const hid = url.searchParams.get('hid');
    if (hid == null) return null;
    const cleaned = hid.trim();
    if (!/^\d+$/.test(cleaned)) return null;
    return cleaned;
  } catch {
    return null;
  }
}
