import { describe, expect, it } from 'vitest';

import { parseAgodaHotelId } from './agodaHidParser';

describe('parseAgodaHotelId', () => {
  it('null/undefined/빈 문자열/공백은 null', () => {
    expect(parseAgodaHotelId(null)).toBeNull();
    expect(parseAgodaHotelId(undefined)).toBeNull();
    expect(parseAgodaHotelId('')).toBeNull();
    expect(parseAgodaHotelId('   ')).toBeNull();
  });

  it('숫자만 입력시 그대로 반환', () => {
    expect(parseAgodaHotelId('24180119')).toBe('24180119');
    expect(parseAgodaHotelId('  24180119  ')).toBe('24180119');
  });

  it('Agoda Partner Search 결과 URL에서 hid 추출', () => {
    const url = 'https://www.agoda.com/partners/partnersearch.aspx?pcs=1&cid=1965770&hl=ko-kr&hid=24180119';
    expect(parseAgodaHotelId(url)).toBe('24180119');
  });

  it('agoda.com 서브도메인 URL도 허용 (예: ko.agoda.com, m.agoda.com)', () => {
    expect(parseAgodaHotelId('https://ko.agoda.com/partners/partnersearch.aspx?hid=1234567')).toBe('1234567');
    expect(parseAgodaHotelId('https://m.agoda.com/search?hid=99')).toBe('99');
  });

  it('파라미터 순서 무관', () => {
    expect(parseAgodaHotelId('https://www.agoda.com/x.html?hid=42&cid=1')).toBe('42');
    expect(parseAgodaHotelId('https://www.agoda.com/x.html?cid=1&hid=42&pcs=1')).toBe('42');
  });

  it('agoda.com 이외 도메인은 null (오입력 방지)', () => {
    expect(parseAgodaHotelId('https://example.com/?hid=1234')).toBeNull();
    expect(parseAgodaHotelId('https://booking.com/?hid=1234')).toBeNull();
    // 도메인 매칭이 정확해야 함: "agoda.com.attacker.com" 같은 형태 차단
    expect(parseAgodaHotelId('https://agoda.com.attacker.com/?hid=1234')).toBeNull();
  });

  it('URL에 hid 파라미터가 없으면 null', () => {
    expect(parseAgodaHotelId('https://www.agoda.com/search?cid=1&hl=ko-kr')).toBeNull();
  });

  it('hid 값이 숫자가 아니면 null', () => {
    expect(parseAgodaHotelId('https://www.agoda.com/?hid=abc')).toBeNull();
    expect(parseAgodaHotelId('https://www.agoda.com/?hid=12-34')).toBeNull();
  });

  it('잘못된 URL 형식은 null', () => {
    expect(parseAgodaHotelId('not a url')).toBeNull();
    expect(parseAgodaHotelId('http://')).toBeNull();
  });

  it('숫자+공백+한글 같은 혼합은 null (URL도 숫자도 아님)', () => {
    expect(parseAgodaHotelId('24180119 호텔')).toBeNull();
  });
});
