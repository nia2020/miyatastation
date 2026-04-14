-- NEW ラベル: アーカイブ動画・メッセージ募集・Googleフォームを個別トラッキング
ALTER TABLE public.user_section_views
  DROP CONSTRAINT IF EXISTS user_section_views_section_check;

ALTER TABLE public.user_section_views
  ADD CONSTRAINT user_section_views_section_check
  CHECK (
    section IN (
      'events',
      'forms',
      'chat',
      'archive_videos',
      'message_collection',
      'google_forms'
    )
  );
