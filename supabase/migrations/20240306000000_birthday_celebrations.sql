-- お祝い済み管理用テーブル（profile_id + year で1件）
CREATE TABLE IF NOT EXISTS public.birthday_celebrations (
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (profile_id, year)
);

ALTER TABLE public.birthday_celebrations ENABLE ROW LEVEL SECURITY;

-- 管理者・投稿者は閲覧・追加・削除可能
CREATE POLICY "Admins and posters can view birthday celebrations"
  ON public.birthday_celebrations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'poster')
    )
  );

CREATE POLICY "Admins and posters can insert birthday celebrations"
  ON public.birthday_celebrations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'poster')
    )
  );

CREATE POLICY "Admins and posters can delete birthday celebrations"
  ON public.birthday_celebrations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'poster')
    )
  );
