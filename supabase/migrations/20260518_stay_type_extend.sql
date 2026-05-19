-- 호텔 stay_type enum 확장: 기존(city/resort/poolvilla/onsen/kids)에 ocean/island 추가
-- 배경: 오션뷰 중심 호텔(시그니엘 부산, 씨마크 강릉 등)과 섬 단위 리조트(JW 메리어트 제주, 파르나스 제주 등)
--       구분 필요에 따라 admin import 단계에서 사용 요청.

alter table public.stays
  drop constraint if exists stays_stay_type_check;

alter table public.stays
  add constraint stays_stay_type_check
  check (stay_type in ('city', 'resort', 'poolvilla', 'onsen', 'kids', 'ocean', 'island'));
