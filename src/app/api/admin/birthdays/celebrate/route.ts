import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

/**
 * お祝い済みのトグル（管理者・投稿者のみ）
 * POST body: { profileId: string, celebrated: boolean }
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "poster") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { profileId, celebrated } = body;

  if (!profileId || typeof profileId !== "string") {
    return NextResponse.json(
      { error: "profileId が必要です" },
      { status: 400 }
    );
  }

  if (typeof celebrated !== "boolean") {
    return NextResponse.json(
      { error: "celebrated は true または false を指定してください" },
      { status: 400 }
    );
  }

  const currentYear = new Date().getFullYear();

  try {
    const admin = createAdminClient();

    if (celebrated) {
      const { error } = await admin.from("birthday_celebrations").upsert(
        { profile_id: profileId, year: currentYear },
        { onConflict: "profile_id,year" }
      );
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      const { error } = await admin
        .from("birthday_celebrations")
        .delete()
        .eq("profile_id", profileId)
        .eq("year", currentYear);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Birthday celebrate toggle error:", err);
    return NextResponse.json(
      { error: "お祝い済みの更新に失敗しました" },
      { status: 500 }
    );
  }
}
