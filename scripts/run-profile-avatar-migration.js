/**
 * profiles に avatar_url カラムを追加（投稿者・管理者用アイコン画像）
 * 使い方: npm run db:migrate-profile-avatar
 */
const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
if (fs.existsSync(path.join(root, ".env.local"))) {
  require("dotenv").config({ path: path.join(root, ".env.local") });
}

async function run() {
  const password = process.env.SUPABASE_DB_PASSWORD;
  if (!password) {
    console.error("エラー: SUPABASE_DB_PASSWORD を設定してください。");
    process.exit(1);
  }

  let projectRef = "isnfuzdnkedfnlllizfa";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    try {
      projectRef = new URL(supabaseUrl).hostname.split(".")[0];
    } catch (_) {}
  }

  const client = new Client({
    connectionString: `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`,
  });

  try {
    await client.connect();
    const sql = fs.readFileSync(
      path.join(root, "supabase", "migrations", "20240311000000_profile_avatar_url.sql"),
      "utf8"
    );
    await client.query(sql);
    console.log("✓ profiles に avatar_url カラムを追加しました");
  } catch (err) {
    console.error("エラー:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
