import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !url.startsWith("http")) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL が設定されていません。.env.local を確認し、アプリを再起動してください。"
    );
  }

  return createBrowserClient(url, key || "");
}
