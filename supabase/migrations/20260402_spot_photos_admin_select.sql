-- spot_photos 테이블에 admin SELECT 정책 추가
-- 기존 spot_photos_select 정책은 published 상태의 spot만 조회 가능하여
-- admin이 draft 상태의 spot에 사진을 추가한 뒤 .select()가 실패하는 문제 수정
CREATE POLICY "spot_photos_admin_select"
ON spot_photos
FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);
