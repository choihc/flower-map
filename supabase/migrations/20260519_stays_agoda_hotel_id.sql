-- stays 테이블에 Agoda 호텔 ID 컬럼 추가.
-- 호텔별 hid가 있으면 Agoda Partner Search의 호텔 페이지로 직접 진입 (partnersearch.aspx?cid=&hid=<id>).
-- 없으면 기존 호텔명 검색 URL로 fallback.
alter table stays
  add column if not exists agoda_hotel_id text;

comment on column stays.agoda_hotel_id is
  'Agoda 호텔 식별자(hid). partnersearch.aspx?cid=&hid=<id>&hl=ko-kr 로 호텔 페이지 직링크에 사용. null이면 호텔명 검색 URL로 fallback.';
