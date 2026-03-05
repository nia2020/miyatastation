/**
 * Supabase マイグレーション実行スクリプト
 * 使い方: SUPABASE_DB_PASSWORD=あなたのDBパスワード node scripts/run-migration.js
 *
 * パスワードの取得: Supabase ダッシュボード > Project Settings > Database > Database password
 */
const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

async function run() {
  const password = process.env.SUPABASE_DB_PASSWORD;
  if (!password) {
    console.error("エラー: データベースパスワードを設定してください。");
    console.error("使い方: SUPABASE_DB_PASSWORD=あなたのパスワード node scripts/run-migration.js");
    console.error("");
    console.error("パスワードの取得方法:");
    console.error("1. Supabase ダッシュボード (https://supabase.com/dashboard) を開く");
    console.error("2. プロジェクトを選択 > Settings > Database");
    console.error("3. 「Database password」を確認（忘れた場合は「Reset database password」で再設定）");
    process.exit(1);
  }

  // .env.local から URL を取得して project ref を抽出
  const envPath = path.join(__dirname, "..", ".env.local");
  let projectRef = "isnfuzdnkedfnlllizfa"; // デフォルト
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(https:\/\/)?([^.]+)\.supabase\.co/);
    if (urlMatch) {
      projectRef = urlMatch[2];
    }
  }

  const connectionString = `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`;

  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log("データベースに接続しました。マイグレーションを実行中...");

    const sqlPath = path.join(__dirname, "..", "supabase", "migrations", "20240302000000_initial_schema.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    await client.query(sql);
    console.log("✓ マイグレーションが正常に完了しました！");
  } catch (err) {
    console.error("エラー:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
