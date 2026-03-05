/**
 * admin_posts に images カラムを追加
 * 使い方: SUPABASE_DB_PASSWORD=あなたのDBパスワード node scripts/run-post-images-migration.js
 */
const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

async function run() {
  const password = process.env.SUPABASE_DB_PASSWORD;
  if (!password) {
    console.error("エラー: SUPABASE_DB_PASSWORD を設定してください。");
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
    console.log("admin_posts に images カラムを追加中...");

    await client.query(`
      ALTER TABLE public.admin_posts
      ADD COLUMN IF NOT EXISTS images JSONB NOT NULL DEFAULT '[]';
    `);

    console.log("✓ 完了しました！");
    console.log("");
    console.log("※ Supabase ダッシュボードで Storage バケットを作成してください:");
    console.log("  1. Storage > New bucket");
    console.log("  2. 名前: post-images");
    console.log("  3. Public bucket にチェック");
  } catch (err) {
    console.error("エラー:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
