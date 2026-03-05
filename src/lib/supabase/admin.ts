import { createClient } from "@supabase/supabase-js";

/**
 * Supabase Admin クライアント（service role）
 * auth.admin.createUser など管理者専用操作に使用。
 * サーバーサイド（API Route）でのみ使用し、クライアントに公開しないこと。
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey || serviceKey.includes("your_")) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY が設定されていません。.env.local を確認してください。"
    );
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
