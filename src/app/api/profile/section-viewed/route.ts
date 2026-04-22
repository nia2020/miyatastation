import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type SectionKey =
  | "events"
  | "forms"
  | "chat"
  | "archive_videos"
  | "message_collection"
  | "google_forms";

const VALID_SECTIONS: readonly SectionKey[] = [
  "events",
  "forms",
  "chat",
  "archive_videos",
  "message_collection",
  "google_forms",
];

/**
 * 送られてきた section を、実際に user_section_views に書き込む section のリストへ拡張する。
 * message_collection / google_forms は、CHECK 制約が未拡張な環境でも NEW を消せるように
 * 後方互換として legacy の "forms" にもフォールバックで記録する。
 */
function expandSectionTargets(section: SectionKey): SectionKey[] {
  if (section === "message_collection" || section === "google_forms") {
    return [section, "forms"];
  }
  return [section];
}

const CHECK_CONSTRAINT_ERROR = "23514";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const section = body?.section as SectionKey | undefined;

    if (!section || !VALID_SECTIONS.includes(section)) {
      return NextResponse.json({ error: "Invalid section" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const targets = expandSectionTargets(section);
    const now = new Date().toISOString();

    let successCount = 0;
    for (const target of targets) {
      const { error } = await admin.from("user_section_views").upsert(
        { user_id: user.id, section: target, last_viewed_at: now },
        { onConflict: "user_id,section" }
      );
      if (!error) {
        successCount += 1;
        continue;
      }
      if (error.code === CHECK_CONSTRAINT_ERROR) {
        // 本番DBに CHECK 制約拡張マイグレーションが未適用のケース。
        // message_collection / google_forms はフォールバックの forms 側で代替記録されるためここは握りつぶす。
        console.warn(
          `section-viewed: skipping '${target}' due to CHECK constraint (migration may not be applied yet)`
        );
        continue;
      }
      console.error("section-viewed upsert error:", error);
    }

    if (successCount === 0) {
      return NextResponse.json(
        {
          error:
            "Failed to update. DB migration 20260415120000_extend_user_section_views_sections may be missing.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("section-viewed error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
