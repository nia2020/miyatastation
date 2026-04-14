-- 会員向けアプリ内お知らせ（コメントなど）
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('comment_on_post')),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_display_name TEXT NOT NULL DEFAULT '',
  actor_avatar_url TEXT,
  post_id UUID REFERENCES public.admin_posts(id) ON DELETE CASCADE,
  post_title TEXT NOT NULL DEFAULT '',
  comment_preview TEXT,
  link_path TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_notifications_user_created_idx
  ON public.user_notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS user_notifications_user_unread_idx
  ON public.user_notifications (user_id)
  WHERE read_at IS NULL;

ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.user_notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.user_notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.user_notifications IS 'In-app notifications; inserts use service role from API only.';
