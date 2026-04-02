CREATE TABLE spot_likes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id    uuid NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  device_id  text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (spot_id, device_id)
);

ALTER TABLE spot_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "spot_likes_select"
ON spot_likes FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "spot_likes_insert"
ON spot_likes FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "spot_likes_delete"
ON spot_likes FOR DELETE TO anon, authenticated
USING (true);

CREATE INDEX idx_spot_likes_spot_id ON spot_likes(spot_id);
CREATE INDEX idx_spot_likes_device_id ON spot_likes(device_id);
