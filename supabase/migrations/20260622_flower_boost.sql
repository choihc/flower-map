ALTER TABLE public.flowers
  ADD COLUMN IF NOT EXISTS boost_start_at date,
  ADD COLUMN IF NOT EXISTS boost_end_at   date;

-- 활성 부스트 조회 가속 (선택)
CREATE INDEX IF NOT EXISTS flowers_boost_idx
  ON public.flowers (boost_start_at, boost_end_at)
  WHERE boost_start_at IS NOT NULL AND boost_end_at IS NOT NULL;
