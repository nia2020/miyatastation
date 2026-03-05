/**
 * 指定メールアドレスを管理者に設定
 * 使い方: SUPABASE_DB_PASSWORD=あなたのDBパスワード node scripts/set-admin.js
 *
 * 注意: 対象のメールアドレスで一度ログイン（会員登録）している必要があります
 */
const { Client } = require("pg");
const path = require("path");

const ADMIN_EMAIL = "sawada.seiji.0116@gmail.com";

async function run() {
  const password = process.env.SUPABASE_DB_PASSWORD;
  if (!password) {
    console.error("エラー: データベースパスワードを設定してください。");
    console.error(
      "使い方: SUPABASE_DB_PASSWORD=あなたのパスワード node scripts/set-admin.js"
    );
    process.exit(1);
  }

  const envPath = path.join(__dirname, "..", ".env.local");
  let projectRef = "isnfuzdnkedfnlllizfa";
  if (require("fs").existsSync(envPath)) {
    const envContent = require("fs").readFileSync(envPath, "utf8");
    const urlMatch = envContent.match(
      /NEXT_PUBLIC_SUPABASE_URL=(https:\/\/)?([^.]+)\.supabase\.co/
    );
    if (urlMatch) {
      projectRef = urlMatch[2];
    }
  }

  const connectionString = `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`;
  const client = new Client({ connectionString });

  try {
    await client.connect();
    const res = await client.query(
      `UPDATE public.profiles SET role = 'admin', updated_at = NOW() WHERE email = $1 RETURNING id, email, full_name, role`,
      [ADMIN_EMAIL]
    );

    if (res.rowCount === 0) {
      console.error(
        `エラー: ${ADMIN_EMAIL} のプロファイルが見つかりません。`
      );
      console.error(
        "先に会員登録ページからこのメールアドレスでログインしてください。"
      );
      process.exit(1);
    }

    console.log("✓ 管理者登録が完了しました！");
    console.log("  メール:", res.rows[0].email);
    console.log("  名前:", res.rows[0].full_name);
    console.log("  役割:", res.rows[0].role);
  } catch (err) {
    console.error("エラー:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
