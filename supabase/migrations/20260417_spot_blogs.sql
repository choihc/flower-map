CREATE TABLE spot_blogs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id         UUID NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  url             TEXT NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  blogger_name    TEXT,
  posted_at       TIMESTAMPTZ,
  relevance_score NUMERIC(3,2),
  fetched_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (spot_id, url)
);
CREATE INDEX spot_blogs_spot_rel_idx
  ON spot_blogs (spot_id, relevance_score DESC, posted_at DESC);

ALTER TABLE spot_blogs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "spot_blogs_anon_read" ON spot_blogs FOR SELECT USING (true);
