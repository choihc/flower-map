-- supabase/migrations/20260329_push_tokens.sql
CREATE TABLE push_tokens (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  token       text        NOT NULL UNIQUE
                          CHECK (token LIKE 'ExponentPushToken[%]'),
  platform    text        NOT NULL CHECK (platform IN ('ios', 'android')),
  user_id     uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- 앱(비로그인 포함)에서 토큰 등록 허용. CHECK constraint로 유효 토큰만 통과.
CREATE POLICY "push_tokens_insert"
ON push_tokens
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 어드민 API(service_role)만 조회 허용
CREATE POLICY "push_tokens_select"
ON push_tokens
FOR SELECT
TO service_role
USING (true);
