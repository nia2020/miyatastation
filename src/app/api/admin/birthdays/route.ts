import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/**
 * お誕生日一覧を取得（管理者・投稿者のみ）
 * 誕生日が登録されている会員のみ返す
 */
export async function GET() {
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

  const currentYear = new Date().getFullYear();

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .select("id, nickname, full_name, birthday, birthday_wish_name")
      .not("birthday", "is", null)
      .order("birthday", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: celebrations } = await admin
      .from("birthday_celebrations")
      .select("profile_id")
      .eq("year", currentYear);

    const celebratedIds = new Set(
      celebrations?.map((c) => c.profile_id) ?? []
    );

    const withCelebrated =
      data?.map((p) => ({
        id: p.id,
        nickname: p.nickname,
        full_name: p.full_name,
        birthday: p.birthday,
        birthday_wish_name: p.birthday_wish_name,
        celebrated: celebratedIds.has(p.id),
      })) ?? [];

    // 月日でソート（遅い方を上に：12/31→1/1の順）
    const sorted = withCelebrated.slice().sort((a, b) => {
      if (!a.birthday || !b.birthday) return 0;
      const [aM, aD] = a.birthday.split("-").slice(1).map(Number);
      const [bM, bD] = b.birthday.split("-").slice(1).map(Number);
      return aM !== bM ? bM - aM : bD - aD;
    });

    return NextResponse.json({ birthdays: sorted });
  } catch (err) {
    console.error("Birthdays list error:", err);
    return NextResponse.json(
      { error: "お誕生日一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}
