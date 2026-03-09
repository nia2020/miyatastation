-- admin_posts に channel カラムを追加（フィードとMK ROOMで別コンテンツ）
ALTER TABLE public.admin_posts
  ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'feed' CHECK (channel IN ('feed', 'mk-room'));

-- 既存データは feed として扱う（DEFAULT で設定済み）
COMMENT ON COLUMN public.admin_posts.channel IS 'feed: フィード, mk-room: MK ROOM';
