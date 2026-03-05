-- 役割に「投稿者」(poster) を追加
-- profiles.role の CHECK 制約を更新
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('member', 'admin', 'poster'));

-- admin_posts: 投稿者も投稿・編集・削除可能に（投稿者は自分の投稿のみ編集・削除）
-- INSERT: admin または poster
DROP POLICY IF EXISTS "Admins can insert admin posts" ON public.admin_posts;
CREATE POLICY "Admins and posters can insert admin posts"
  ON public.admin_posts FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'poster')
    )
  );

-- UPDATE: admin は全件、poster は自分の投稿のみ
DROP POLICY IF EXISTS "Admins can update admin posts" ON public.admin_posts;
CREATE POLICY "Admins and posters can update admin posts"
  ON public.admin_posts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR (
      author_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'poster'
      )
    )
  );

-- DELETE: admin は全件、poster は自分の投稿のみ
DROP POLICY IF EXISTS "Admins can delete admin posts" ON public.admin_posts;
CREATE POLICY "Admins and posters can delete admin posts"
  ON public.admin_posts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR (
      author_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'poster'
      )
    )
  );
