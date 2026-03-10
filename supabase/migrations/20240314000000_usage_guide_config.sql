-- ご利用案内の初期データを site_config に追加
INSERT INTO public.site_config (key, value, updated_at)
VALUES (
  'usage_guide',
  '["入会から12ヶ月経過した会員は、プロフィール編集画面からアイコン画像を設定できます。"]',
  NOW()
)
ON CONFLICT (key) DO NOTHING;
