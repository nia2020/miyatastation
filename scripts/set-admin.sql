-- sawada.seiji.0116@gmail.com を管理者に設定
-- 実行方法: Supabase ダッシュボード > SQL Editor でこのファイルの内容を実行

UPDATE public.profiles
SET role = 'admin', updated_at = NOW()
WHERE email = 'sawada.seiji.0116@gmail.com';
