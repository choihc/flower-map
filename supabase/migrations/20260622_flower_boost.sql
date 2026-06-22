ALTER TABLE public.flowers
  ADD COLUMN IF NOT EXISTS boost_start_at date,
  ADD COLUMN IF NOT EXISTS boost_end_at   date;

-- 활성 부스트 조회 가속 (선택)
CREATE INDEX IF NOT EXISTS flowers_boost_idx
  ON public.flowers (boost_start_at, boost_end_at)
  WHERE boost_start_at IS NOT NULL AND boost_end_at IS NOT NULL;

-- 부스트 기간 무결성을 DB 레벨에서 강제 (FR-2-3):
--   둘 다 NULL 또는 둘 다 NOT NULL 이어야 하고, 시작일 <= 종료일.
--   어드민 flowerSchema 검증을 우회하는 경로(직접 SQL 등)에서도 비정상 행을 차단한다.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'flowers_boost_range_chk'
  ) THEN
    ALTER TABLE public.flowers
      ADD CONSTRAINT flowers_boost_range_chk
      CHECK (
        (boost_start_at IS NULL AND boost_end_at IS NULL)
        OR (boost_start_at IS NOT NULL AND boost_end_at IS NOT NULL
            AND boost_start_at <= boost_end_at)
      );
  END IF;
END $$;
