/* eslint-disable */
import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";
import { resolve } from "path";

loadEnv({ path: resolve(process.cwd(), ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(url, key);

async function main() {
  const { data, error } = await supabase
    .from("site_config")
    .select("key, value, updated_at")
    .in("key", [
      "message_collection_forms",
      "google_form_url",
      "message_collection_title",
      "announcement",
    ]);
  if (error) {
    console.error(error);
    process.exit(1);
  }
  for (const row of data ?? []) {
    console.log("=== key:", row.key, " updated_at:", row.updated_at);
    console.log(row.value);
    console.log();
  }
}

main();
