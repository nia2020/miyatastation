/* eslint-disable */
import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";
import { resolve } from "path";

loadEnv({ path: resolve(process.cwd(), ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(url, key);

async function main() {
  console.log("--- user_section_views (latest 50) ---");
  const { data: views, error: viewsErr } = await supabase
    .from("user_section_views")
    .select("user_id, section, last_viewed_at")
    .order("last_viewed_at", { ascending: false })
    .limit(50);
  if (viewsErr) console.error(viewsErr);
  else console.log(views);

  console.log("\n--- distinct sections currently in table ---");
  if (views) {
    const set = new Set(views.map((v) => v.section));
    console.log([...set]);
  }

  console.log("\n--- try to insert mk_room as test ---");
  const { error: insertErr } = await supabase.from("user_section_views").upsert(
    {
      user_id: "00000000-0000-0000-0000-000000000000",
      section: "mk_room",
      last_viewed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,section" }
  );
  if (insertErr) {
    console.log("INSERT mk_room error:", insertErr.code, insertErr.message);
  } else {
    console.log("mk_room insert OK -- cleaning up");
    await supabase
      .from("user_section_views")
      .delete()
      .eq("user_id", "00000000-0000-0000-0000-000000000000")
      .eq("section", "mk_room");
  }

  console.log("\n--- try to insert usage_guide as test ---");
  const { error: insertErr2 } = await supabase
    .from("user_section_views")
    .upsert(
      {
        user_id: "00000000-0000-0000-0000-000000000000",
        section: "usage_guide",
        last_viewed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,section" }
    );
  if (insertErr2) {
    console.log("INSERT usage_guide error:", insertErr2.code, insertErr2.message);
  } else {
    console.log("usage_guide insert OK -- cleaning up");
    await supabase
      .from("user_section_views")
      .delete()
      .eq("user_id", "00000000-0000-0000-0000-000000000000")
      .eq("section", "usage_guide");
  }

  console.log("\n--- try to insert archive_videos as test ---");
  const { error: insertErr3 } = await supabase
    .from("user_section_views")
    .upsert(
      {
        user_id: "00000000-0000-0000-0000-000000000000",
        section: "archive_videos",
        last_viewed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,section" }
    );
  if (insertErr3) {
    console.log("INSERT archive_videos error:", insertErr3.code, insertErr3.message);
  } else {
    console.log("archive_videos insert OK -- cleaning up");
    await supabase
      .from("user_section_views")
      .delete()
      .eq("user_id", "00000000-0000-0000-0000-000000000000")
      .eq("section", "archive_videos");
  }
}

main();
