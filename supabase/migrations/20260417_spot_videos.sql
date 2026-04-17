CREATE TABLE spot_videos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id         UUID NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  video_id        TEXT NOT NULL,
  title           TEXT NOT NULL,
  channel_title   TEXT,
  thumbnail_url   TEXT,
  published_at    TIMESTAMPTZ,
  view_count      INTEGER,
  relevance_score NUMERIC(3,2),
  fetched_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (spot_id, video_id)
);
CREATE INDEX spot_videos_spot_rel_idx
  ON spot_videos (spot_id, relevance_score DESC, published_at DESC);

ALTER TABLE spot_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "spot_videos_anon_read" ON spot_videos FOR SELECT USING (true);
