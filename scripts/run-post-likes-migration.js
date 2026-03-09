/**
 * post_likes テーブル作成スクリプト（タイムライン投稿へのいいね機能）
 * 使い方: SUPABASE_DB_PASSWORD=あなたのDBパスワード node scripts/run-post-likes-migration.js
 */
const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

// .env.local を優先して読み込み
const root = path.join(__dirname, "..");
if (fs.existsSync(path.join(root, ".env.local"))) {
  require("dotenv").config({ path: path.join(root, ".env.local") });
} else if (fs.existsSync(path.join(root, ".env"))) {
  require("dotenv").config({ path: path.join(root, ".env") });
}

async function run() {
  const password =
    process.env.SUPABASE_DB_PASSWORD ?? process.env.SUPABASE_DATABASE_PASSWORD;
  if (!password || typeof password !== "string" || !password.trim()) {
    console.error("エラー: SUPABASE_DB_PASSWORD を設定してください。");
    console.error("  .env.local に次の1行を追加してください（スペル・大文字小文字を正確に）:");
    console.error("  SUPABASE_DB_PASSWORD=あなたのDBパスワード");
    console.error("");
    console.error("  コマンド実行時に渡す場合: SUPABASE_DB_PASSWORD=xxx npm run db:migrate-post-likes");
    console.error("  DBパスワードは Supabase ダッシュボード > Settings > Database で確認できます。");
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
      path.join(__dirname, "..", "supabase", "migrations", "20240310000000_post_likes.sql"),
      "utf8"
    );
    await client.query(sql);
    console.log("✓ post_likes テーブルの作成が完了しました");
  } catch (err) {
    console.error("エラー:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
