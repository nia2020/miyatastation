/**
 * 指定メールアドレスを管理者に設定（Supabase クライアント使用・DBパスワード不要）
 * 使い方: node scripts/set-admin-supabase.js
 *
 * .env.local に SUPABASE_SERVICE_ROLE_KEY を設定してください
 * 取得: Supabase ダッシュボード > Settings > API > service_role (secret)
 */
const fs = require("fs");
const path = require("path");

// .env.local を読み込み（値に=が含まれる場合に対応）
const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf8")
    .split("\n")
    .forEach((line) => {
      const eqIndex = line.indexOf("=");
      if (eqIndex > 0 && !line.trim().startsWith("#")) {
        const key = line.substring(0, eqIndex).trim();
        const value = line.substring(eqIndex + 1).trim().replace(/^["']|["']$/g, "");
        process.env[key] = value; // .env.local を優先
      }
    });
}

const { createClient } = require("@supabase/supabase-js");

const ADMIN_EMAIL = "sawada.seiji.0116@gmail.com";

async function run() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey || serviceKey.includes("your_")) {
    console.error("エラー: .env.local に SUPABASE_SERVICE_ROLE_KEY を設定してください。");
    console.error("取得: Supabase ダッシュボード > Settings > API > service_role (secret)");
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  const { data, error } = await supabase
    .from("profiles")
    .update({ role: "admin", updated_at: new Date().toISOString() })
    .eq("email", ADMIN_EMAIL)
    .select("id, email, full_name, role")
    .single();

  if (error) {
    console.error("エラー:", error.message);
    process.exit(1);
  }

  if (!data) {
    console.error(`エラー: ${ADMIN_EMAIL} のプロファイルが見つかりません。`);
    console.error("Supabase ダッシュボード > Authentication > Users から先にユーザーを作成してください。");
    process.exit(1);
  }

  console.log("✓ 管理者登録が完了しました！");
  console.log("  メール:", data.email);
  console.log("  名前:", data.full_name);
  console.log("  役割:", data.role);
}

run();
