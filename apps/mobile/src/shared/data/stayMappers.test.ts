import { describe, expect, it } from 'vitest';

import { toStay } from './stayMappers';
import type { StayRow } from './types';

const baseStayRow: StayRow = {
  id: 'stay-1',
  slug: 'jeju-onsen-villa',
  name: '제주 온천 빌라',
  region_primary: '제주',
  region_secondary: '제주 서귀포시',
  address: '제주 서귀포시 어느로 1',
  latitude: 33.2541,
  longitude: 126.5601,
  stay_type: 'onsen',
  season_tags: ['겨울', '온천'],
  season_window_start: '11-01',
  season_window_end: '03-31',
  short_tagline: '겨울에 가장 빛나는 온천 호캉스',
  description: '온천과 함께 쉬어가는 제주 호캉스',
  recommendation_points: ['실내 온천', '오션뷰'],
  tripcom_booking_url: null,
  thumbnail_url: 'https://blob.example.com/stay-1.jpg',
  booking_query_override: null,
  naver_rating_score: 4.5,
  naver_rating_url: 'https://map.naver.com/stay-1',
  google_rating_score: 4.4,
  google_rating_url: 'https://maps.google.com/stay-1',
  rating_captured_at: '2026-05-10',
  is_featured: true,
  display_order: 1,
};

describe('toStay', () => {
  it('maps all StayRow fields to Stay domain', () => {
    const stay = toStay(baseStayRow);

    expect(stay.id).toBe('stay-1');
    expect(stay.slug).toBe('jeju-onsen-villa');
    expect(stay.name).toBe('제주 온천 빌라');
    expect(stay.regionPrimary).toBe('제주');
    expect(stay.regionSecondary).toBe('제주 서귀포시');
    expect(stay.address).toBe('제주 서귀포시 어느로 1');
    expect(stay.latitude).toBe(33.2541);
    expect(stay.longitude).toBe(126.5601);
    expect(stay.stayType).toBe('onsen');
    expect(stay.seasonTags).toEqual(['겨울', '온천']);
    expect(stay.seasonWindowStart).toBe('11-01');
    expect(stay.seasonWindowEnd).toBe('03-31');
    expect(stay.shortTagline).toBe('겨울에 가장 빛나는 온천 호캉스');
    expect(stay.description).toBe('온천과 함께 쉬어가는 제주 호캉스');
    expect(stay.recommendationPoints).toEqual(['실내 온천', '오션뷰']);
    expect(stay.thumbnailUrl).toBe('https://blob.example.com/stay-1.jpg');
    expect(stay.bookingQueryOverride).toBeNull();
    expect(stay.ratingCapturedAt).toBe('2026-05-10');
    expect(stay.isFeatured).toBe(true);
    expect(stay.displayOrder).toBe(1);
  });

  it('returns naverRating as { score, url } when both fields are present', () => {
    const stay = toStay(baseStayRow);

    expect(stay.naverRating).toEqual({
      score: 4.5,
      url: 'https://map.naver.com/stay-1',
    });
  });

  it('returns googleRating as { score, url } when both fields are present', () => {
    const stay = toStay(baseStayRow);

    expect(stay.googleRating).toEqual({
      score: 4.4,
      url: 'https://maps.google.com/stay-1',
    });
  });

  it('returns naverRating null when both score and url are null', () => {
    const stay = toStay({
      ...baseStayRow,
      naver_rating_score: null,
      naver_rating_url: null,
    });

    expect(stay.naverRating).toBeNull();
  });

  it('returns naverRating null when only score is present (defensive)', () => {
    const stay = toStay({
      ...baseStayRow,
      naver_rating_score: 4.5,
      naver_rating_url: null,
    });

    expect(stay.naverRating).toBeNull();
  });

  it('returns naverRating null when only url is present (defensive)', () => {
    const stay = toStay({
      ...baseStayRow,
      naver_rating_score: null,
      naver_rating_url: 'https://map.naver.com/stay-1',
    });

    expect(stay.naverRating).toBeNull();
  });

  it('returns googleRating null when both score and url are null', () => {
    const stay = toStay({
      ...baseStayRow,
      google_rating_score: null,
      google_rating_url: null,
    });

    expect(stay.googleRating).toBeNull();
  });

  it('returns googleRating null when only score is present (defensive)', () => {
    const stay = toStay({
      ...baseStayRow,
      google_rating_score: 4.4,
      google_rating_url: null,
    });

    expect(stay.googleRating).toBeNull();
  });

  it('returns googleRating null when only url is present (defensive)', () => {
    const stay = toStay({
      ...baseStayRow,
      google_rating_score: null,
      google_rating_url: 'https://maps.google.com/stay-1',
    });

    expect(stay.googleRating).toBeNull();
  });

  it('maps season_tags null to empty array', () => {
    const stay = toStay({ ...baseStayRow, season_tags: null });
    expect(stay.seasonTags).toEqual([]);
  });

  it('maps recommendation_points null to empty array', () => {
    const stay = toStay({ ...baseStayRow, recommendation_points: null });
    expect(stay.recommendationPoints).toEqual([]);
  });

  it('keeps season_window_start/end as null when null', () => {
    const stay = toStay({
      ...baseStayRow,
      season_window_start: null,
      season_window_end: null,
    });

    expect(stay.seasonWindowStart).toBeNull();
    expect(stay.seasonWindowEnd).toBeNull();
  });

  it('keeps thumbnail_url and booking_query_override null when null', () => {
    const stay = toStay({
      ...baseStayRow,
      thumbnail_url: null,
      booking_query_override: null,
    });

    expect(stay.thumbnailUrl).toBeNull();
    expect(stay.bookingQueryOverride).toBeNull();
  });

  it('tripcom_booking_url이 null이면 tripcomBookingUrl을 null로 매핑한다', () => {
    const stay = toStay({ ...baseStayRow, tripcom_booking_url: null });
    expect(stay.tripcomBookingUrl).toBeNull();
  });

  it('tripcom_booking_url이 있으면 tripcomBookingUrl로 그대로 매핑한다', () => {
    const url = 'https://kr.trip.com/hotels/detail/?hotelId=123';
    const stay = toStay({ ...baseStayRow, tripcom_booking_url: url });
    expect(stay.tripcomBookingUrl).toBe(url);
  });

  it('returns naverRating null when score is NaN (defensive against malformed input)', () => {
    const stay = toStay({
      ...baseStayRow,
      naver_rating_score: 'abc' as unknown as number,
      naver_rating_url: 'https://map.naver.com/stay-1',
    });

    expect(stay.naverRating).toBeNull();
  });
});
