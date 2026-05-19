import { describe, expect, it } from 'vitest';

import { formatDateYYYYMMDD } from './exportZip';

describe('formatDateYYYYMMDD', () => {
  it('한자리 월/일은 0으로 패딩한다', () => {
    expect(formatDateYYYYMMDD(new Date(2026, 0, 5))).toBe('20260105');
  });
  it('12월 31일을 올바르게 포맷한다', () => {
    expect(formatDateYYYYMMDD(new Date(2026, 11, 31))).toBe('20261231');
  });
  it('두자리 월/일은 그대로 둔다', () => {
    expect(formatDateYYYYMMDD(new Date(2026, 9, 20))).toBe('20261020');
  });
});
