import { describe, expect, it } from 'vitest';

import { staySchema } from './staySchema';

const baseStay = {
  slug: 'hotel-naru-magok',
  name: '호텔 나루 서울 마곡',
  region_primary: '서울',
  region_secondary: '강서',
  address: '서울 강서구 마곡중앙8로 38',
  latitude: 37.56,
  longitude: 126.82,
  stay_type: 'city' as const,
  short_tagline: '도심에서 즐기는 인피니티풀과 한강 야경',
  description: '한강뷰가 일품인 도심형 호텔.',
};

describe('staySchema', () => {
  it('필수 필드만으로 파싱 성공 (기본값 채움)', () => {
    const result = staySchema.parse(baseStay);
    expect(result.status).toBe('draft');
    expect(result.is_featured).toBe(false);
    expect(result.display_order).toBe(0);
    expect(result.season_tags).toEqual([]);
    expect(result.recommendation_points).toEqual([]);
  });

  it('잘못된 stay_type 차단', () => {
    const r = staySchema.safeParse({ ...baseStay, stay_type: 'hostel' });
    expect(r.success).toBe(false);
  });

  it('recommendation_points 11개 이상 차단', () => {
    const r = staySchema.safeParse({
      ...baseStay,
      recommendation_points: Array.from({ length: 11 }, (_, i) => `point${i}`),
    });
    expect(r.success).toBe(false);
  });

  it('slug regex 위반 차단', () => {
    expect(staySchema.safeParse({ ...baseStay, slug: 'Hotel_Naru' }).success).toBe(false);
    expect(staySchema.safeParse({ ...baseStay, slug: 'a' }).success).toBe(false);
  });

  it('latitude/longitude 범위 검증', () => {
    expect(staySchema.safeParse({ ...baseStay, latitude: 91 }).success).toBe(false);
    expect(staySchema.safeParse({ ...baseStay, longitude: -181 }).success).toBe(false);
  });

  it('season_window MM-DD 형식 검증', () => {
    expect(staySchema.safeParse({
      ...baseStay,
      season_window_start: '05-01',
      season_window_end: '08-31',
    }).success).toBe(true);
    expect(staySchema.safeParse({
      ...baseStay,
      season_window_start: '5-1',
      season_window_end: '8-31',
    }).success).toBe(false);
    expect(staySchema.safeParse({
      ...baseStay,
      season_window_start: '13-01',
      season_window_end: '08-31',
    }).success).toBe(false);
  });

  it('season_window 한쪽만 채워진 경우 차단', () => {
    const r = staySchema.safeParse({
      ...baseStay,
      season_window_start: '05-01',
      season_window_end: null,
    });
    expect(r.success).toBe(false);
  });

  it('naver/google rating score-url 짝 정합성 검증', () => {
    expect(staySchema.safeParse({
      ...baseStay,
      naver_rating_score: 4.5,
      naver_rating_url: null,
    }).success).toBe(false);
    expect(staySchema.safeParse({
      ...baseStay,
      google_rating_score: null,
      google_rating_url: 'https://google.com/x',
    }).success).toBe(false);
  });

  it('rating 정보가 있으면 rating_captured_at 필수', () => {
    expect(staySchema.safeParse({
      ...baseStay,
      naver_rating_score: 4.5,
      naver_rating_url: 'https://m.place.naver.com/place/123',
      rating_captured_at: null,
    }).success).toBe(false);
    expect(staySchema.safeParse({
      ...baseStay,
      naver_rating_score: 4.5,
      naver_rating_url: 'https://m.place.naver.com/place/123',
      rating_captured_at: '2026-05-08',
    }).success).toBe(true);
  });

  it('rating 점수 0-5 범위 외 차단', () => {
    expect(staySchema.safeParse({
      ...baseStay,
      naver_rating_score: 5.5,
      naver_rating_url: 'https://m.place.naver.com/place/123',
      rating_captured_at: '2026-05-08',
    }).success).toBe(false);
  });

  it('thumbnail_url은 https URL이어야 함', () => {
    expect(staySchema.safeParse({
      ...baseStay,
      thumbnail_url: 'not-a-url',
    }).success).toBe(false);
  });

  it('thumbnail_url의 javascript:/data:/file: 스킴은 차단된다 (XSS 방지)', () => {
    expect(staySchema.safeParse({
      ...baseStay,
      thumbnail_url: 'javascript:alert(1)',
    }).success).toBe(false);
    expect(staySchema.safeParse({
      ...baseStay,
      thumbnail_url: 'data:text/html,<script>alert(1)</script>',
    }).success).toBe(false);
    expect(staySchema.safeParse({
      ...baseStay,
      thumbnail_url: 'file:///etc/passwd',
    }).success).toBe(false);
  });

  it('rating URL의 javascript: 스킴은 차단된다', () => {
    expect(staySchema.safeParse({
      ...baseStay,
      naver_rating_score: 4.5,
      naver_rating_url: 'javascript:alert(1)',
      rating_captured_at: '2026-05-08',
    }).success).toBe(false);
  });

  it('tripcom_booking_url null/생략 모두 허용', () => {
    expect(staySchema.safeParse({ ...baseStay }).success).toBe(true);
    expect(staySchema.safeParse({ ...baseStay, tripcom_booking_url: null }).success).toBe(true);
  });

  it('tripcom_booking_url 유효한 https URL 허용', () => {
    const url = 'https://kr.trip.com/hotels/detail/?hotelId=123&Allianceid=456&SID=789';
    const r = staySchema.parse({ ...baseStay, tripcom_booking_url: url });
    expect(r.tripcom_booking_url).toBe(url);
  });

  it('tripcom_booking_url의 비-http(s) 스킴 차단 (XSS 방지)', () => {
    expect(staySchema.safeParse({ ...baseStay, tripcom_booking_url: 'javascript:alert(1)' }).success).toBe(false);
    expect(staySchema.safeParse({ ...baseStay, tripcom_booking_url: 'data:text/html,<script>alert(1)</script>' }).success).toBe(false);
    expect(staySchema.safeParse({ ...baseStay, tripcom_booking_url: 'file:///etc/passwd' }).success).toBe(false);
    expect(staySchema.safeParse({ ...baseStay, tripcom_booking_url: 'not-a-url' }).success).toBe(false);
    // 스킴은 맞지만 malformed URL — 직링크 실패를 방지하기 위해 차단되어야 한다 (P2 회귀 방지)
    expect(staySchema.safeParse({ ...baseStay, tripcom_booking_url: 'https://' }).success).toBe(false);
    expect(staySchema.safeParse({ ...baseStay, tripcom_booking_url: 'https://foo bar' }).success).toBe(false);
  });

  it('agoda_hotel_id null/생략 모두 허용', () => {
    expect(staySchema.safeParse({ ...baseStay }).success).toBe(true);
    expect(staySchema.safeParse({ ...baseStay, agoda_hotel_id: null }).success).toBe(true);
  });

  it('agoda_hotel_id 숫자 문자열 허용', () => {
    const r = staySchema.parse({ ...baseStay, agoda_hotel_id: '24180119' });
    expect(r.agoda_hotel_id).toBe('24180119');
  });

  it('agoda_hotel_id 비숫자 차단', () => {
    expect(staySchema.safeParse({ ...baseStay, agoda_hotel_id: 'abc' }).success).toBe(false);
    expect(staySchema.safeParse({ ...baseStay, agoda_hotel_id: 'https://agoda.com/x?hid=1' }).success).toBe(false);
  });
});
