import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

/**
 * パスワードをリセットし、新しいパスワードを返す（管理者のみ）
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

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { userId } = body;

  if (!userId) {
    return NextResponse.json(
      { error: "ユーザーIDが必要です" },
      { status: 400 }
    );
  }

  const { randomBytes } = await import("crypto");
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(12);
  let newPassword = "";
  for (let i = 0; i < 12; i++) {
    newPassword += chars[bytes[i] % chars.length];
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      newPassword,
    });
  } catch (err) {
    console.error("Password reset error:", err);
    return NextResponse.json(
      { error: "パスワードのリセットに失敗しました" },
      { status: 500 }
    );
  }
}
