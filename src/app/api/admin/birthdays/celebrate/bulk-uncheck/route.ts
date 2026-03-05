import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

/**
 * 月ごとにお祝い済みを一斉に解除（管理者・投稿者のみ）
 * POST body: { profileIds: string[] }
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
  const { profileIds } = body;

  if (!Array.isArray(profileIds)) {
    return NextResponse.json(
      { error: "profileIds は配列で指定してください" },
      { status: 400 }
    );
  }

  const validIds = profileIds.filter(
    (id): id is string => typeof id === "string" && id.length > 0
  );

  if (validIds.length === 0) {
    return NextResponse.json({ success: true });
  }

  const currentYear = new Date().getFullYear();

  try {
    const admin = createAdminClient();

    const { error } = await admin
      .from("birthday_celebrations")
      .delete()
      .eq("year", currentYear)
      .in("profile_id", validIds);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Birthday bulk uncheck error:", err);
    return NextResponse.json(
      { error: "お祝い済みの一斉解除に失敗しました" },
      { status: 500 }
    );
  }
}
