-- admin_posts に published_at カラムを追加（予約投稿用）
-- NULL = 即時公開、日時指定 = その時刻に公開
ALTER TABLE public.admin_posts
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
