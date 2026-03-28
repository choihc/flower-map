CREATE TABLE spot_photos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id     uuid NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  url         text NOT NULL,
  sort_order  integer NOT NULL DEFAULT 0,
  caption     text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE spot_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "spot_photos_select"
ON spot_photos
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM spots
    WHERE spots.id = spot_photos.spot_id
      AND spots.status = 'published'
  )
);

CREATE POLICY "spot_photos_insert"
ON spot_photos
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);

CREATE POLICY "spot_photos_delete"
ON spot_photos
FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);
