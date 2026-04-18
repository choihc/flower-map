-- now_score 계열 컬럼 추가
ALTER TABLE spots
  ADD COLUMN bloom_score   NUMERIC(5,2),
  ADD COLUMN trend_score   NUMERIC(5,2),
  ADD COLUMN content_score NUMERIC(5,2),
  ADD COLUMN yoy_score     NUMERIC(5,2),
  ADD COLUMN now_score     NUMERIC(5,2),
  ADD COLUMN now_score_at  TIMESTAMPTZ;

CREATE INDEX spots_now_score_idx
  ON spots (now_score DESC NULLS LAST)
  WHERE now_score IS NOT NULL;
