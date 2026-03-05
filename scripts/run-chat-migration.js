/**
 * admin_posts / post_comments テーブル作成スクリプト（タイムライン機能用）
 * 使い方: SUPABASE_DB_PASSWORD=あなたのDBパスワード node scripts/run-chat-migration.js
 */
const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

async function run() {
  const password = process.env.SUPABASE_DB_PASSWORD;
  if (!password) {
    console.error("エラー: SUPABASE_DB_PASSWORD を設定してください。");
    console.error("例: SUPABASE_DB_PASSWORD=あなたのパスワード node scripts/run-chat-migration.js");
    process.exit(1);
  }

  const envPath = path.join(__dirname, "..", ".env.local");
  let projectRef = "isnfuzdnkedfnlllizfa";
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(https:\/\/)?([^.]+)\.supabase\.co/);
    if (urlMatch) projectRef = urlMatch[2];
  }

  const client = new Client({
    connectionString: `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`,
  });

  try {
    await client.connect();
    console.log("admin_posts / post_comments テーブルを作成中...");

    await client.query(`
      CREATE TABLE IF NOT EXISTS public.admin_posts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log("  ✓ admin_posts テーブル作成完了");

    await client.query(`ALTER TABLE public.admin_posts ENABLE ROW LEVEL SECURITY;`);

    await client.query(`
      DROP POLICY IF EXISTS "Authenticated users can view admin posts" ON public.admin_posts;
      CREATE POLICY "Authenticated users can view admin posts"
        ON public.admin_posts FOR SELECT TO authenticated USING (true);
    `);
    await client.query(`
      DROP POLICY IF EXISTS "Admins can insert admin posts" ON public.admin_posts;
      CREATE POLICY "Admins can insert admin posts"
        ON public.admin_posts FOR INSERT TO authenticated
        WITH CHECK (
          auth.uid() = author_id
          AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
        );
    `);
    await client.query(`
      DROP POLICY IF EXISTS "Admins can update admin posts" ON public.admin_posts;
      CREATE POLICY "Admins can update admin posts"
        ON public.admin_posts FOR UPDATE TO authenticated
        USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
    `);
    await client.query(`
      DROP POLICY IF EXISTS "Admins can delete admin posts" ON public.admin_posts;
      CREATE POLICY "Admins can delete admin posts"
        ON public.admin_posts FOR DELETE TO authenticated
        USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
    `);
    console.log("  ✓ admin_posts ポリシー作成完了");

    await client.query(`
      CREATE TABLE IF NOT EXISTS public.post_comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id UUID NOT NULL REFERENCES public.admin_posts(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log("  ✓ post_comments テーブル作成完了");

    await client.query(`ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;`);

    await client.query(`
      DROP POLICY IF EXISTS "Authenticated users can view comments" ON public.post_comments;
      CREATE POLICY "Authenticated users can view comments"
        ON public.post_comments FOR SELECT TO authenticated USING (true);
    `);
    await client.query(`
      DROP POLICY IF EXISTS "Authenticated users can insert comments" ON public.post_comments;
      CREATE POLICY "Authenticated users can insert comments"
        ON public.post_comments FOR INSERT TO authenticated
        WITH CHECK (auth.uid() = user_id);
    `);
    await client.query(`
      DROP POLICY IF EXISTS "Users can delete own comments" ON public.post_comments;
      CREATE POLICY "Users can delete own comments"
        ON public.post_comments FOR DELETE TO authenticated
        USING (auth.uid() = user_id);
    `);
    await client.query(`
      DROP POLICY IF EXISTS "Admins can delete any comment" ON public.post_comments;
      CREATE POLICY "Admins can delete any comment"
        ON public.post_comments FOR DELETE TO authenticated
        USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
    `);
    console.log("  ✓ post_comments ポリシー作成完了");

    console.log("\n✓ タイムライン（チャット）のセットアップが完了しました！");
  } catch (err) {
    console.error("エラー:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
