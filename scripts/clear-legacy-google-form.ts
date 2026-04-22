/* eslint-disable */
import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";
import { resolve } from "path";

loadEnv({ path: resolve(process.cwd(), ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(url, key);

async function main() {
  const now = new Date().toISOString();
  for (const k of ["google_form_url", "message_collection_title"]) {
    const { error } = await supabase
      .from("site_config")
      .upsert({ key: k, value: "", updated_at: now }, { onConflict: "key" });
    if (error) {
      console.error(`failed to clear ${k}`, error);
      process.exit(1);
    }
    console.log(`cleared ${k}`);
  }

  const { data } = await supabase
    .from("site_config")
    .select("key, value")
    .in("key", ["google_form_url", "message_collection_title"]);
  console.log("after:", data);
}

main();
