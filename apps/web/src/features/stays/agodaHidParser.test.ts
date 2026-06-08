import { describe, expect, it } from 'vitest';

import { parseAgodaHotelId } from './agodaHidParser';

describe('parseAgodaHotelId', () => {
  it('숫자만 입력하면 그대로 반환한다', () => {
    expect(parseAgodaHotelId('24180119')).toBe('24180119');
  });

  it('전체 Agoda URL에서 hid를 추출한다', () => {
    const url = 'https://www.agoda.com/partners/partnersearch.aspx?pcs=1&cid=1965770&hl=ko-kr&hid=24180119';
    expect(parseAgodaHotelId(url)).toBe('24180119');
  });

  it('빈 입력/공백은 null', () => {
    expect(parseAgodaHotelId('')).toBeNull();
    expect(parseAgodaHotelId('   ')).toBeNull();
    expect(parseAgodaHotelId(null)).toBeNull();
    expect(parseAgodaHotelId(undefined)).toBeNull();
  });

  it('agoda.com이 아닌 도메인은 null', () => {
    expect(parseAgodaHotelId('https://example.com/?hid=24180119')).toBeNull();
  });

  it('hid가 없거나 비숫자면 null', () => {
    expect(parseAgodaHotelId('https://www.agoda.com/partners/partnersearch.aspx?cid=1')).toBeNull();
    expect(parseAgodaHotelId('https://www.agoda.com/x?hid=abc')).toBeNull();
    expect(parseAgodaHotelId('not-a-url')).toBeNull();
  });
});
