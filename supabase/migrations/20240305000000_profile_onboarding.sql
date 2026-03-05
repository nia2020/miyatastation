-- 初回ログイン時のプロフィール入力用カラムを追加
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS nickname TEXT,
  ADD COLUMN IF NOT EXISTS birthday DATE,
  ADD COLUMN IF NOT EXISTS birthday_wish_name TEXT;
