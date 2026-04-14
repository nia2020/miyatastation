import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

const VALID_SECTIONS = [
  "events",
  "forms",
  "chat",
  "archive_videos",
  "message_collection",
  "google_forms",
] as const;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const section = body?.section;

    if (!section || !VALID_SECTIONS.includes(section)) {
      return NextResponse.json(
        { error: "Invalid section" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { error } = await admin.from("user_section_views").upsert(
      { user_id: user.id, section, last_viewed_at: new Date().toISOString() },
      { onConflict: "user_id,section" }
    );

    if (error) {
      console.error("section-viewed upsert error:", error);
      return NextResponse.json(
        { error: "Failed to update" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("section-viewed error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
