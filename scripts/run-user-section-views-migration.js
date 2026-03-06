/**
 * user_section_views テーブル作成スクリプト（NEW ラベル用）
 * 使い方: SUPABASE_DB_PASSWORD=あなたのDBパスワード node scripts/run-user-section-views-migration.js
 */
const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

function loadEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const m = line.match(/^SUPABASE_DB_PASSWORD=(.+)$/);
      if (m) return m[1].replace(/^["']|["']$/g, "").trim();
    }
  }
  return null;
}

async function run() {
  const password = process.env.SUPABASE_DB_PASSWORD || loadEnvLocal();
  if (!password) {
    console.error("エラー: SUPABASE_DB_PASSWORD を設定してください。");
    console.error("  .env.local に SUPABASE_DB_PASSWORD=あなたのDBパスワード を追加するか、");
    console.error("  コマンド実行時に SUPABASE_DB_PASSWORD=xxx npm run db:migrate-user-section-views としてください。");
    console.error("  DBパスワードは Supabase ダッシュボード > Settings > Database で確認できます。");
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
    const sql = fs.readFileSync(
      path.join(__dirname, "..", "supabase", "migrations", "20240308000000_user_section_views.sql"),
      "utf8"
    );
    await client.query(sql);
    console.log("✓ user_section_views テーブルの作成が完了しました");
  } catch (err) {
    console.error("エラー:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
