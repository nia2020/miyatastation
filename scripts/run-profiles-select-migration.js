/**
 * コメント投稿者名表示用：認証済みユーザーが他ユーザーのプロフィールを閲覧可能にするマイグレーション
 * 使い方: SUPABASE_DB_PASSWORD=あなたのDBパスワード node scripts/run-profiles-select-migration.js
 */
const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

async function run() {
  const password = process.env.SUPABASE_DB_PASSWORD;
  if (!password) {
    console.error("エラー: SUPABASE_DB_PASSWORD を設定してください。");
    console.error(
      "使い方: SUPABASE_DB_PASSWORD=あなたのパスワード node scripts/run-profiles-select-migration.js"
    );
    process.exit(1);
  }

  const envPath = path.join(__dirname, "..", ".env.local");
  let projectRef = "isnfuzdnkedfnlllizfa";
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    const urlMatch = envContent.match(
      /NEXT_PUBLIC_SUPABASE_URL=(https:\/\/)?([^.]+)\.supabase\.co/
    );
    if (urlMatch) projectRef = urlMatch[2];
  }

  const client = new Client({
    connectionString: `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`,
  });

  try {
    await client.connect();
    console.log("プロフィール閲覧ポリシーを追加中...");

    const sqlPath = path.join(
      __dirname,
      "..",
      "supabase",
      "migrations",
      "20240307000000_profiles_select_authenticated.sql"
    );
    const sql = fs.readFileSync(sqlPath, "utf8");
    await client.query(sql);

    console.log("✓ マイグレーションが正常に完了しました！");
    console.log("  コメントに投稿者の名前が表示されるようになりました。");
  } catch (err) {
    console.error("エラー:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
