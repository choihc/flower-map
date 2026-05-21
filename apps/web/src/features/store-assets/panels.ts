export type PanelConfig = {
  index: number;
  slug: string;
  headline: string;
  subhead: string;
  /** 좌하단 푸터에 표시되는 패널 라벨. 예: "지도 + 숙소 카드" */
  footerLabel: string;
  isNew?: boolean;
  /** CSS background. 그라데이션 또는 단색. */
  background: string;
};

export const PANELS: readonly PanelConfig[] = [
  {
    index: 1,
    slug: 'hotel',
    headline: '명소와 한번에\n호텔까지',
    subhead: '꽃 명소 옆 숙소를 같이 볼 수 있는 새 기능',
    footerLabel: '지도 + 숙소 카드',
    isNew: true,
    background: 'linear-gradient(170deg, #E4D2F0 0%, #D0B6E4 100%)',
  },
  {
    index: 2,
    slug: 'detail',
    headline: '명소 상세를\n풍부하게',
    subhead: '영상과 블로그 글을 함께 확인',
    footerLabel: '명소 상세 페이지',
    background: 'linear-gradient(170deg, #FFD9E2 0%, #FBBFD0 100%)',
  },
  {
    index: 3,
    slug: 'home',
    headline: '오늘,\n꽃 보러 갈까?',
    subhead: '지금 피는 꽃을 한 눈에',
    footerLabel: '홈 — 추천 명소',
    background: 'linear-gradient(170deg, #FFDDCC 0%, #FFBFA6 100%)',
  },
  {
    index: 4,
    slug: 'bloom',
    headline: '실시간\n개화정보',
    subhead: '전국 명소 개화율을 한 화면에',
    footerLabel: '개화 현황 대시보드',
    background: 'linear-gradient(170deg, #FFE8B6 0%, #FFCF82 100%)',
  },
  {
    index: 5,
    slug: 'nearby',
    headline: '주변 꽃 명소\n추천',
    subhead: '현재 위치 기반 명소 지도',
    footerLabel: '주변 지도',
    background: 'linear-gradient(170deg, #D6EFC2 0%, #B5E0A2 100%)',
  },
  {
    index: 6,
    slug: 'direction',
    headline: '길찾기까지\n한번에',
    subhead: '지금 바로 찾아가는 꽃 나들이',
    footerLabel: '길찾기',
    background: 'linear-gradient(170deg, #CFE3F4 0%, #A8C9E4 100%)',
  },
  {
    index: 7,
    slug: 'saved',
    headline: '나만의\n꽃 명소',
    subhead: '다시 찾고 싶은 장소 쉽게 저장',
    footerLabel: '저장한 명소',
    background: 'linear-gradient(170deg, #FFF1DC 0%, #F0DCAF 100%)',
  },
];

if (process.env.NODE_ENV !== 'production') {
  const slugs = PANELS.map((p) => p.slug);
  if (new Set(slugs).size !== slugs.length) {
    throw new Error(`[store-assets/panels] 슬러그 중복 발견: ${slugs.join(', ')}`);
  }
}
