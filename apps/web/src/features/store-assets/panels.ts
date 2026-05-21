export type PanelLayout = 'impact' | 'closeup';

export type PanelConfig = {
  index: number;
  slug: string;
  /** 'impact'는 1번 NEW 패널처럼 폰 없이 거대 카피 + 해시태그 + 꽃잎 어센트, 'closeup'은 폰 우하단 사선 클로즈업 */
  layout: PanelLayout;
  headline: string;
  subhead: string;
  isNew?: boolean;
  /** CSS background 문자열. 단색 hex 또는 linear-gradient(...) 모두 허용. */
  background: string;
  /** impact 레이아웃에서 카피 아래에 노출할 해시태그 칩. closeup에서는 무시. */
  tags?: readonly string[];
  flowerAccent?: 'sakura' | 'lilac' | 'none';
};

export const PANELS: readonly PanelConfig[] = [
  {
    index: 1,
    slug: 'hotel',
    layout: 'impact',
    headline: '명소와 한번에\n호텔까지',
    subhead: '꽃 명소 옆 숙소를 같이 볼 수 있는 새 기능',
    isNew: true,
    background: 'linear-gradient(165deg, #F0E0F5 0%, #D9BCEA 50%, #C5A4DC 100%)',
    tags: ['#호캉스', '#꽃길드라이브', '#1박힐링'],
    flowerAccent: 'lilac',
  },
  {
    index: 2,
    slug: 'detail',
    layout: 'closeup',
    headline: '명소 상세를\n풍부하게',
    subhead: '영상과 블로그 글을 함께 확인',
    background: 'linear-gradient(165deg, #FFE3EE 0%, #FFB4CB 60%, #E89AB1 100%)',
    flowerAccent: 'sakura',
  },
  {
    index: 3,
    slug: 'home',
    layout: 'closeup',
    headline: '오늘,\n꽃 보러 갈까?',
    subhead: '지금 피는 꽃을 한 눈에',
    background: 'linear-gradient(165deg, #FFE7DC 0%, #FFC0B0 60%, #E89A8A 100%)',
    flowerAccent: 'sakura',
  },
  {
    index: 4,
    slug: 'bloom',
    layout: 'closeup',
    headline: '실시간\n개화정보',
    subhead: '전국 명소 개화율을 한 화면에',
    background: 'linear-gradient(165deg, #FFF1DD 0%, #FFC59A 60%, #E89A6A 100%)',
    flowerAccent: 'sakura',
  },
  {
    index: 5,
    slug: 'nearby',
    layout: 'closeup',
    headline: '주변 꽃 명소\n추천',
    subhead: '현재 위치 기반 명소 지도',
    background: 'linear-gradient(165deg, #E8F4E2 0%, #B7DAA8 60%, #8FBE7B 100%)',
    flowerAccent: 'none',
  },
  {
    index: 6,
    slug: 'direction',
    layout: 'closeup',
    headline: '길찾기까지\n한번에',
    subhead: '지금 바로 찾아가는 꽃 나들이',
    background: 'linear-gradient(165deg, #E8E2F5 0%, #C0B0E0 60%, #9A8AD8 100%)',
    flowerAccent: 'none',
  },
  {
    index: 7,
    slug: 'saved',
    layout: 'closeup',
    headline: '나만의\n꽃 명소',
    subhead: '다시 찾고 싶은 장소 쉽게 저장',
    background: 'linear-gradient(165deg, #FFF6E5 0%, #F0DEB0 60%, #D8B97A 100%)',
    flowerAccent: 'sakura',
  },
];

if (process.env.NODE_ENV !== 'production') {
  const slugs = PANELS.map((p) => p.slug);
  if (new Set(slugs).size !== slugs.length) {
    throw new Error(`[store-assets/panels] 슬러그 중복 발견: ${slugs.join(', ')}`);
  }
}
