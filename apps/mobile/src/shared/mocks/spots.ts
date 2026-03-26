export type FlowerSpot = {
  id: string;
  badge: string;
  bloomStatus: string;
  description: string;
  eventEndsIn?: string;
  fee: string;
  festivalDate: string;
  flower: string;
  helper: string;
  location: string;
  parking: string;
  place: string;
  tone: 'green' | 'pink' | 'yellow';
};

export const featuredSpots: FlowerSpot[] = [
  {
    id: 'yeouido-yunjung-ro',
    badge: '이번 주 절정',
    bloomStatus: '지금 보기 좋아요',
    description: '한강 바람을 따라 걷기 좋은 서울 대표 벚꽃 산책 코스',
    eventEndsIn: 'D-12',
    fee: '무료',
    festivalDate: '2026.04.01 - 2026.04.07',
    flower: '벚꽃',
    helper: '산책 동선이 좋고, 축제 분위기가 살아 있는 대표 스팟',
    location: '서울 영등포구',
    parking: '인근 공영주차장 이용 권장',
    place: '여의도 윤중로',
    tone: 'pink',
  },
  {
    id: 'jeju-noksan-ro',
    badge: '지금 방문 추천',
    bloomStatus: '포토 스팟',
    description: '도로를 따라 길게 펼쳐지는 유채꽃 풍경이 인상적인 드라이브 코스',
    eventEndsIn: 'D-18',
    fee: '무료',
    festivalDate: '2026.03.20 - 2026.04.15',
    flower: '유채꽃',
    helper: '넓게 펼쳐진 노란 들판과 드라이브 감성이 좋은 코스',
    location: '제주 서귀포시',
    parking: '도로변 지정 주차 구역 확인 필요',
    place: '제주 녹산로',
    tone: 'yellow',
  },
  {
    id: 'everland-tulip-garden',
    badge: '가족 나들이 추천',
    bloomStatus: '이번 주 추천',
    description: '알록달록한 튤립 군락과 봄 축제 동선을 한 번에 즐길 수 있는 장소',
    eventEndsIn: 'D-22',
    fee: '유료',
    festivalDate: '2026.04.05 - 2026.04.28',
    flower: '튤립',
    helper: '사진 촬영 포인트가 많고 이동 동선이 편한 편이에요',
    location: '경기 용인시',
    parking: '전용 주차장 이용 가능',
    place: '에버랜드 튤립가든',
    tone: 'green',
  },
  {
    id: 'namsan-azalea-trail',
    badge: '산책 코스 추천',
    bloomStatus: '이번 주 추천',
    description: '언덕을 따라 진달래 색감이 이어지는 봄 산책 코스로 잔잔한 분위기가 좋아요',
    eventEndsIn: 'D-10',
    fee: '무료',
    festivalDate: '2026.04.03 - 2026.04.18',
    flower: '진달래',
    helper: '화려한 벚꽃보다 차분한 봄 무드를 좋아하면 잘 맞는 코스예요',
    location: '서울 용산구',
    parking: '대중교통 접근 권장',
    place: '남산 진달래길',
    tone: 'pink',
  },
];

export const regionSummaries = [
  '서울/경기',
  '부산/경남',
  '전주/남도',
  '제주',
];

export const flowerLabels = ['벚꽃', '진달래', '튤립', '유채꽃'];
