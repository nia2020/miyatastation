-- profiles に avatar_url カラムを追加（投稿者・管理者用アイコン画像）
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;
