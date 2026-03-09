-- post_likes テーブル（投稿へのいいね）
CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.admin_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON public.post_likes(user_id);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーは全いいねを閲覧可能
CREATE POLICY "Authenticated users can view post likes"
  ON public.post_likes FOR SELECT
  TO authenticated
  USING (true);

-- 認証済みユーザーは自分のいいねを追加可能
CREATE POLICY "Authenticated users can insert own likes"
  ON public.post_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 認証済みユーザーは自分のいいねを削除可能
CREATE POLICY "Users can delete own likes"
  ON public.post_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
