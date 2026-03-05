-- サイト設定（Google Form URL など）
CREATE TABLE IF NOT EXISTS public.site_config (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーは閲覧可能
CREATE POLICY "Authenticated users can read site config"
  ON public.site_config FOR SELECT
  TO authenticated
  USING (true);

-- 管理者のみ更新可能
CREATE POLICY "Admins can update site config"
  ON public.site_config FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
