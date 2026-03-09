/**
 * admin_posts に channel カラムを追加（フィードとMK ROOMで別コンテンツ）
 * 使い方: npm run db:migrate-channel
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
      path.join(root, "supabase", "migrations", "20240313000000_admin_posts_channel.sql"),
      "utf8"
    );
    await client.query(sql);
    console.log("✓ admin_posts に channel カラムを追加しました");
  } catch (err) {
    console.error("エラー:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
