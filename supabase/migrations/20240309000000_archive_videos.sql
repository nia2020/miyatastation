-- アーカイブ動画テーブル（YouTubeリンクと公開期間を管理）
CREATE TABLE IF NOT EXISTS public.archive_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  youtube_url TEXT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.archive_videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view archive videos" ON public.archive_videos;
CREATE POLICY "Authenticated users can view archive videos"
  ON public.archive_videos FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can manage archive videos" ON public.archive_videos;
CREATE POLICY "Admins can manage archive videos"
  ON public.archive_videos FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
