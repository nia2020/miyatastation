/**
 * site_config テーブル作成スクリプト
 * 使い方: SUPABASE_DB_PASSWORD=あなたのDBパスワード node scripts/run-site-config-migration.js
 */
const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

async function run() {
  const password = process.env.SUPABASE_DB_PASSWORD;
  if (!password) {
    console.error("エラー: SUPABASE_DB_PASSWORD を設定してください。");
    console.error("例: SUPABASE_DB_PASSWORD=あなたのパスワード node scripts/run-site-config-migration.js");
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
    console.log("site_config テーブルを作成中...");

    await client.query(`
      CREATE TABLE IF NOT EXISTS public.site_config (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log("  ✓ テーブル作成完了");

    await client.query(`
      ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;
    `);
    console.log("  ✓ RLS 有効化完了");

    await client.query(`
      DROP POLICY IF EXISTS "Authenticated users can read site config" ON public.site_config;
      CREATE POLICY "Authenticated users can read site config"
        ON public.site_config FOR SELECT TO authenticated USING (true);
    `);
    console.log("  ✓ 閲覧ポリシー作成完了");

    await client.query(`
      DROP POLICY IF EXISTS "Admins can update site config" ON public.site_config;
      CREATE POLICY "Admins can update site config"
        ON public.site_config FOR ALL TO authenticated
        USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
        WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
    `);
    console.log("  ✓ 管理者ポリシー作成完了");

    console.log("\n✓ site_config のセットアップが完了しました！");
  } catch (err) {
    console.error("エラー:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
