-- stays 테이블에 trip.com 제휴 예약 URL 컬럼 추가.
-- 값이 있으면 앱이 해당 URL을 그대로 열고, 없으면 trip.com 호텔명 검색으로 fallback.
-- 기존 agoda_hotel_id 컬럼은 전환기 동안 유지(구버전 앱 호환). OTA 보급 후 별도 마이그레이션으로 drop.
alter table public.stays
  add column if not exists tripcom_booking_url text;

comment on column public.stays.tripcom_booking_url is
  'trip.com 제휴 예약 URL 전체. 값이 있으면 그대로 오픈, null이면 kr.trip.com 호텔명 검색으로 fallback.';
