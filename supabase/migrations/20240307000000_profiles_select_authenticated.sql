-- 認証済みユーザーが他ユーザーのプロフィール（名前表示用）を閲覧可能にする
-- コメント投稿者名の表示に必要
CREATE POLICY "Authenticated users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);
