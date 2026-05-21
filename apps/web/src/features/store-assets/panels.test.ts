import { describe, expect, it } from 'vitest';

import { PANELS, type PanelConfig } from './panels';

describe('PANELS', () => {
  it('7개의 패널을 정의한다', () => {
    expect(PANELS).toHaveLength(7);
  });

  it('1번 패널은 NEW 호텔 패널이다', () => {
    expect(PANELS[0]?.slug).toBe('hotel');
    expect(PANELS[0]?.isNew).toBe(true);
  });

  it('순서는 1~7이 빠짐없이 채워진다', () => {
    const indices = PANELS.map((p) => p.index).sort((a, b) => a - b);
    expect(indices).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('슬러그는 유니크하다', () => {
    const slugs = PANELS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('모든 패널이 헤드라인/서브헤드/배경/푸터 라벨을 갖는다', () => {
    PANELS.forEach((p: PanelConfig) => {
      expect(p.headline.length).toBeGreaterThan(0);
      expect(p.subhead.length).toBeGreaterThan(0);
      expect(p.background.length).toBeGreaterThan(0);
      expect(p.footerLabel.length).toBeGreaterThan(0);
    });
  });
});
