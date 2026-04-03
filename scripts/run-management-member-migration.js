/**
 * 役割に「管理メンバー」(management_member) を追加するマイグレーション
 * 使い方: SUPABASE_DB_PASSWORD=あなたのDBパスワード node scripts/run-management-member-migration.js
 */
const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

async function run() {
  const password = process.env.SUPABASE_DB_PASSWORD;
  if (!password) {
    console.error("エラー: データベースパスワードを設定してください。");
    console.error(
      "使い方: SUPABASE_DB_PASSWORD=あなたのパスワード node scripts/run-management-member-migration.js"
    );
    process.exit(1);
  }

  const envPath = path.join(__dirname, "..", ".env.local");
  let projectRef = "isnfuzdnkedfnlllizfa";
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(https:\/\/)?([^.]+)\.supabase\.co/);
    if (urlMatch) projectRef = urlMatch[2];
  }

  const connectionString = `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`;
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log("データベースに接続しました。管理メンバーロールのマイグレーションを実行中...");

    const sqlPath = path.join(
      __dirname,
      "..",
      "supabase",
      "migrations",
      "20260403100000_add_management_member_role.sql"
    );
    const sql = fs.readFileSync(sqlPath, "utf8");

    await client.query(sql);
    console.log("✓ マイグレーションが正常に完了しました！");
    console.log("  役割「management_member」（管理メンバー）が利用可能になりました。");
  } catch (err) {
    console.error("エラー:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
