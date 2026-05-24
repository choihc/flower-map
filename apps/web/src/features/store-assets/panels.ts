import type { PaletteKey } from './designTokens';

export type PanelConfig = {
  index: number;
  slug: string;
  /** 헤드라인 2줄 (배열 형태로 정확한 줄바꿈 보존) */
  title: readonly [string, string];
  subtitle: string;
  /** 팔레트 키 — designTokens의 PALETTES와 매칭 */
  palette: PaletteKey;
  /** 폰 내부 placeholder에 표시되는 라벨 (예: "지도 + 숙소 카드") */
  phoneNote: string;
  isNew?: boolean;
};

export const PANELS: readonly PanelConfig[] = [
  {
    index: 1,
    slug: 'hotel',
    title: ['명소와 한번에', '호텔까지'],
    subtitle: '꽃 명소 옆 숙소를 같이 볼 수 있는 새 기능',
    palette: 'lilac',
    phoneNote: '지도 + 숙소 카드',
    isNew: true,
  },
  {
    index: 2,
    slug: 'detail',
    title: ['명소 상세를', '풍부하게'],
    subtitle: '영상과 블로그 글을 함께 확인',
    palette: 'blossom',
    phoneNote: '명소 상세 페이지',
  },
  {
    index: 3,
    slug: 'home',
    title: ['오늘,', '꽃 보러 갈까?'],
    subtitle: '지금 피는 꽃을 한 눈에',
    palette: 'peach',
    phoneNote: '홈 — 추천 명소',
  },
  {
    index: 4,
    slug: 'bloom',
    title: ['실시간', '개화정보'],
    subtitle: '전국 명소 개화율을 한 화면에',
    palette: 'amber',
    phoneNote: '개화 현황 대시보드',
  },
  {
    index: 5,
    slug: 'nearby',
    title: ['주변 꽃 명소', '추천'],
    subtitle: '현재 위치 기반 명소 지도',
    palette: 'fern',
    phoneNote: '주변 지도',
  },
  {
    index: 6,
    slug: 'direction',
    title: ['길찾기까지', '한번에'],
    subtitle: '지금 바로 찾아가는 꽃 나들이',
    palette: 'iris',
    phoneNote: '길찾기 화면',
  },
];

if (process.env.NODE_ENV !== 'production') {
  const slugs = PANELS.map((p) => p.slug);
  if (new Set(slugs).size !== slugs.length) {
    throw new Error(`[store-assets/panels] 슬러그 중복 발견: ${slugs.join(', ')}`);
  }
}
