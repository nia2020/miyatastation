-- 役割に「管理メンバー」(management_member) を追加
-- メンバーと同じ権限で、運用上の区分として利用する
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('member', 'management_member', 'admin', 'poster'));
