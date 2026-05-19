'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type FormatEntry = {
  id: 'flower-with-spots' | 'spot-on-existing-flower' | 'stay' | 'stays-bulk';
  title: string;
  hint: string;
  snippet: string;
};

const FORMATS: readonly FormatEntry[] = [
  {
    id: 'flower-with-spots',
    title: '1) 꽃 신규 등록 + 명소 일괄',
    hint: '신규 꽃을 등록하면서 명소를 함께 입력합니다. 이미 같은 slug의 꽃이 있으면 그 꽃을 재사용해 명소만 추가됩니다.',
    snippet: `{
  "flower": {
    "slug": "lilac",
    "name_ko": "라일락",
    "name_en": "Lilac",
    "color_hex": "#B695C0",
    "season_start_month": 4,
    "season_end_month": 5,
    "sort_order": 10,
    "is_active": true
  },
  "spots": [
    {
      "slug": "lilac-yongsan-family-park",
      "name": "용산가족공원 라일락",
      "region_primary": "서울",
      "region_secondary": "용산",
      "address": "서울 용산구 서빙고로 137",
      "latitude": 37.524,
      "longitude": 126.998,
      "description": "도심 속 라일락 군락지.",
      "short_tip": "4월 말 ~ 5월 초가 절정입니다.",
      "bloom_start_at": "2026-04-20",
      "bloom_end_at": "2026-05-10"
    }
  ]
}`,
  },
  {
    id: 'spot-on-existing-flower',
    title: '2) 기존 꽃에 명소 단건 추가',
    hint: '이미 등록된 꽃에 명소를 한 건씩 추가합니다. 여러 건이면 이 포맷을 반복 사용하세요.',
    snippet: `{
  "flower_slug": "lilac",
  "spot": {
    "slug": "lilac-namsan",
    "name": "남산 라일락길",
    "region_primary": "서울",
    "region_secondary": "중구",
    "address": "서울 중구 남산공원길",
    "latitude": 37.551,
    "longitude": 126.988,
    "description": "남산 둘레길의 라일락 향기.",
    "short_tip": "오후 산책 추천.",
    "bloom_start_at": "2026-04-22",
    "bloom_end_at": "2026-05-08"
  }
}`,
  },
  {
    id: 'stay',
    title: '3) 호텔(호캉스) 단건 등록',
    hint: '신규 호텔이면 INSERT, 같은 slug가 이미 있으면 UPDATE됩니다. stay_type 허용값: city / resort / poolvilla / onsen / kids / ocean / island. recommendation_points는 최대 10개. 평점이 있으면 score-url 쌍과 rating_captured_at이 모두 필요합니다. ⚠️ 예시 JSON의 cdn.example.com / place/12345 / cid=12345 / agoda_hotel_id 같은 placeholder URL/ID는 반드시 실제 값으로 교체하세요. agoda_hotel_id는 호텔 페이지로 직접 진입하기 위한 Agoda 호텔 식별자(hid)로, Agoda Partners 백오피스에서 조회 가능합니다. 없으면 호텔명 검색으로 fallback됩니다.',
    snippet: `{
  "stay": {
    "slug": "hotel-naru-magok",
    "name": "호텔 나루 서울 마곡",
    "region_primary": "서울",
    "region_secondary": "강서",
    "address": "서울 강서구 마곡중앙8로 38",
    "latitude": 37.563,
    "longitude": 126.824,
    "stay_type": "city",
    "season_tags": ["가족", "한강뷰"],
    "short_tagline": "도심에서 즐기는 인피니티풀과 한강 야경",
    "description": "한강뷰가 일품인 도심형 호텔. 인피니티풀과 스카이라운지에서 시즌 야경을 즐길 수 있어요.",
    "recommendation_points": [
      "인피니티풀에서 보는 한강 일몰",
      "키즈 어메니티 무료 제공",
      "셀프 체크인 키오스크"
    ],
    "thumbnail_url": "https://cdn.example.com/stays/naru-magok-hero.jpg",
    "booking_query_override": "호텔 나루 서울 숙박",
    "agoda_hotel_id": "12345678",
    "naver_rating_score": 4.6,
    "naver_rating_url": "https://m.place.naver.com/place/12345/home",
    "google_rating_score": 4.4,
    "google_rating_url": "https://maps.google.com/?cid=12345",
    "rating_captured_at": "2026-05-08",
    "status": "draft",
    "is_featured": true,
    "display_order": 10
  }
}`,
  },
  {
    id: 'stays-bulk',
    title: '4) 호텔(호캉스) 복수 일괄 등록',
    hint: '한 번에 여러 호텔을 등록합니다. 부분 실패 허용 — 성공한 호텔은 저장되고 실패한 호텔만 결과 패널에 오류로 표시됩니다. 동일 payload 내 slug 중복은 검증 단계에서 차단됩니다. 평점/URL/booking_query_override/thumbnail_url/agoda_hotel_id 등 옵션 필드는 3번 카드 예시 참고. agoda_hotel_id를 입력하면 호텔 페이지로 직접 진입 (없으면 호텔명 검색 fallback). ⚠️ 슬러그·위경도·주소 등은 반드시 실제 값으로 교체하세요.',
    snippet: `{
  "stays": [
    {
      "slug": "hotel-naru-magok",
      "name": "호텔 나루 서울 마곡",
      "region_primary": "서울",
      "region_secondary": "강서",
      "address": "서울 강서구 마곡중앙8로 38",
      "latitude": 37.563,
      "longitude": 126.824,
      "stay_type": "city",
      "season_tags": ["가족", "한강뷰"],
      "short_tagline": "도심에서 즐기는 인피니티풀과 한강 야경",
      "description": "한강뷰가 일품인 도심형 호텔.",
      "agoda_hotel_id": "12345678",
      "recommendation_points": [
        "인피니티풀에서 보는 한강 일몰",
        "키즈 어메니티 무료 제공"
      ],
      "status": "draft",
      "is_featured": true,
      "display_order": 10
    },
    {
      "slug": "soneva-jeju",
      "name": "소네바 제주",
      "region_primary": "제주",
      "region_secondary": "서귀포",
      "address": "제주 서귀포시 안덕면 산록남로 727",
      "latitude": 33.301,
      "longitude": 126.395,
      "stay_type": "resort",
      "season_tags": ["프라이빗풀", "오션뷰"],
      "short_tagline": "고요한 제주 남쪽 해안의 풀빌라 리조트",
      "description": "한라산과 바다를 한 번에 담는 럭셔리 리조트.",
      "recommendation_points": [
        "객실마다 프라이빗풀 제공",
        "조식 다이닝의 시즌 한정 메뉴"
      ],
      "status": "draft",
      "is_featured": false,
      "display_order": 20
    }
  ]
}`,
  },
] as const;

export function ImportFormatGuide() {
  const [openIds, setOpenIds] = useState<ReadonlySet<FormatEntry['id']>>(new Set());
  const [copiedId, setCopiedId] = useState<FormatEntry['id'] | null>(null);

  const toggleOpen = (id: FormatEntry['id']) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCopy = async (entry: FormatEntry) => {
    try {
      await navigator.clipboard.writeText(entry.snippet);
      setCopiedId(entry.id);
      setTimeout(() => setCopiedId((prev) => (prev === entry.id ? null : prev)), 2000);
    } catch (err) {
      console.warn('[ImportFormatGuide] 복사 실패', err);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="px-6 py-6">
        <CardTitle>지원 포맷</CardTitle>
        <CardDescription>
          허용되는 JSON 포맷 4종을 확인하세요. 예시 JSON을 복사해 AI에게 "이 포맷대로 [목표] 데이터 만들어줘"라고 요청하면 됩니다.
          최상위가 배열인 JSON은 허용되지 않습니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 px-6 pb-6">
        {FORMATS.map((entry) => {
          const isOpen = openIds.has(entry.id);
          const isCopied = copiedId === entry.id;
          return (
            <div key={entry.id} className="rounded-2xl border border-border bg-background">
              <button
                type="button"
                onClick={() => toggleOpen(entry.id)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <span className="text-sm font-semibold text-foreground">{entry.title}</span>
                <span className="text-xs text-muted-foreground">{isOpen ? '접기' : '펼치기'}</span>
              </button>
              {isOpen ? (
                <div className="space-y-3 border-t border-border px-4 py-3">
                  <p className="text-xs text-muted-foreground">{entry.hint}</p>
                  <pre className="overflow-x-auto rounded-xl bg-muted px-3 py-3 text-[12px] leading-5 text-foreground">
                    <code>{entry.snippet}</code>
                  </pre>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy(entry)}
                    >
                      {isCopied ? '복사됨' : '예시 JSON 복사'}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
