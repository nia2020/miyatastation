/**
 * 初回ログイン時のパスワード変更強制用カラム追加
 * 使い方: SUPABASE_DB_PASSWORD=あなたのDBパスワード node scripts/run-must-change-password-migration.js
 * または .env.local に SUPABASE_DB_PASSWORD を設定して node scripts/run-must-change-password-migration.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env.local") });
const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

async function run() {
  const password = process.env.SUPABASE_DB_PASSWORD;
  if (!password) {
    console.error("エラー: SUPABASE_DB_PASSWORD を設定してください。");
    console.error("使い方: SUPABASE_DB_PASSWORD=あなたのパスワード node scripts/run-must-change-password-migration.js");
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
    console.log("must_change_password カラムを追加中...");

    const sqlPath = path.join(__dirname, "..", "supabase", "migrations", "20240315000000_must_change_password.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");
    await client.query(sql);

    console.log("✓ マイグレーションが正常に完了しました！");
    console.log("  初回ログイン時にパスワード変更が必須になります。");
  } catch (err) {
    console.error("エラー:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
