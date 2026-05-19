export type PanelConfig = {
  index: number;
  slug: string;
  headline: string;
  subhead: string;
  isNew?: boolean;
  background: string;
  flowerAccent?: 'sakura' | 'lilac' | 'none';
};

export const PANELS: readonly PanelConfig[] = [
  {
    index: 1,
    slug: 'hotel',
    headline: '명소와 한번에 호텔까지',
    subhead: '꽃 명소 주변 숙소를 바로 예약',
    isNew: true,
    background: '#E6DCEE',
    flowerAccent: 'lilac',
  },
  {
    index: 2,
    slug: 'detail',
    headline: '명소 상세를 풍부하게',
    subhead: '영상과 블로그 글을 함께 확인',
    background: '#FCE4EC',
    flowerAccent: 'sakura',
  },
  {
    index: 3,
    slug: 'home',
    headline: '오늘, 꽃 보러 갈까?',
    subhead: '지금 피는 꽃을 한 눈에',
    background: '#F7C8D4',
    flowerAccent: 'sakura',
  },
  {
    index: 4,
    slug: 'bloom',
    headline: '실시간 개화정보',
    subhead: '전국 명소 개화율을 한 화면에',
    background: '#FCE0C8',
    flowerAccent: 'sakura',
  },
  {
    index: 5,
    slug: 'nearby',
    headline: '주변 꽃 명소 추천',
    subhead: '현재 위치 기반 명소 지도',
    background: '#D6EDD9',
    flowerAccent: 'none',
  },
  {
    index: 6,
    slug: 'direction',
    headline: '길찾기까지 한번에',
    subhead: '지금 바로 찾아가는 꽃 나들이',
    background: '#DDD6F0',
    flowerAccent: 'none',
  },
  {
    index: 7,
    slug: 'saved',
    headline: '나만의 꽃 명소',
    subhead: '다시 찾고 싶은 장소 쉽게 저장',
    background: '#F0E6D2',
    flowerAccent: 'sakura',
  },
];

if (process.env.NODE_ENV !== 'production') {
  const slugs = PANELS.map((p) => p.slug);
  if (new Set(slugs).size !== slugs.length) {
    throw new Error(`[store-assets/panels] 슬러그 중복 발견: ${slugs.join(', ')}`);
  }
}
