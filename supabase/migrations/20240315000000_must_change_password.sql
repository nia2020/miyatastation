-- 初回ログイン時のパスワード変更強制用カラム
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT true;

-- 既存ユーザーはパスワード変更済みとみなす（本マイグレーション以前のユーザー）
UPDATE public.profiles SET must_change_password = false;
