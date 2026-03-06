-- ユーザーごとのセクション最終閲覧日時（NEW ラベル用）
CREATE TABLE IF NOT EXISTS public.user_section_views (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section TEXT NOT NULL CHECK (section IN ('events', 'forms', 'chat')),
  last_viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, section)
);

ALTER TABLE public.user_section_views ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーは自分のレコードのみ読み取り・更新可能
CREATE POLICY "Users can read own section views"
  ON public.user_section_views FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own section views"
  ON public.user_section_views FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own section views"
  ON public.user_section_views FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
