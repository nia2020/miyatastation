-- NEW ラベル: MK ROOM・ご利用案内を追加トラッキング
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
      'google_forms',
      'mk_room',
      'usage_guide'
    )
  );
