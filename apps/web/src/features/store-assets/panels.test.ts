import { describe, expect, it } from 'vitest';

import { PALETTES } from './designTokens';
import { PANELS, type PanelConfig } from './panels';

describe('PANELS', () => {
  it('6개의 패널을 정의한다', () => {
    expect(PANELS).toHaveLength(6);
  });

  it('1번 패널은 NEW 호텔 패널이다', () => {
    expect(PANELS[0]?.slug).toBe('hotel');
    expect(PANELS[0]?.isNew).toBe(true);
  });

  it('순서는 1~6이 빠짐없이 채워진다', () => {
    const indices = PANELS.map((p) => p.index).sort((a, b) => a - b);
    expect(indices).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('슬러그는 유니크하다', () => {
    const slugs = PANELS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('모든 패널이 헤드라인 두 줄/서브헤드/팔레트/phoneNote를 갖는다', () => {
    PANELS.forEach((p: PanelConfig) => {
      expect(p.title).toHaveLength(2);
      expect(p.title[0].length).toBeGreaterThan(0);
      expect(p.title[1].length).toBeGreaterThan(0);
      expect(p.subtitle.length).toBeGreaterThan(0);
      expect(p.phoneNote.length).toBeGreaterThan(0);
      expect(PALETTES[p.palette]).toBeDefined();
    });
  });
});
