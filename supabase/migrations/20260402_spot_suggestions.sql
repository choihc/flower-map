CREATE TABLE spot_suggestions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  address     text,
  description text,
  device_id   text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE spot_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "spot_suggestions_insert"
ON spot_suggestions FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "spot_suggestions_admin_select"
ON spot_suggestions FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);
