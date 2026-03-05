import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/** 誕生日の2週間前以内かどうか */
function isWithinTwoWeeksBeforeBirthday(birthdayStr: string): boolean {
  const [_, month, day] = birthdayStr.split("-").map(Number);
  const today = new Date();
  const thisYearBirthday = new Date(today.getFullYear(), month - 1, day);
  let nextBirthday = thisYearBirthday;
  if (thisYearBirthday < today) {
    nextBirthday = new Date(today.getFullYear() + 1, month - 1, day);
  }
  const twoWeeksBefore = new Date(nextBirthday);
  twoWeeksBefore.setDate(twoWeeksBefore.getDate() - 14);
  return today >= twoWeeksBefore && today < nextBirthday;
}

/**
 * プロフィール更新（ニックネーム・お祝い用名前）
 * 誕生日は変更不可。読んで欲しい名前は誕生日2週間前から変更不可。
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("birthday, birthday_wish_name")
    .eq("id", user.id)
    .single();

  if (!existingProfile?.birthday) {
    return NextResponse.json(
      { error: "誕生日が登録されていません" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const { nickname, birthday_wish_name } = body;

  if (!nickname || typeof nickname !== "string") {
    return NextResponse.json(
      { error: "ニックネームを入力してください" },
      { status: 400 }
    );
  }

  const trimmedNickname = nickname.trim();
  if (!trimmedNickname) {
    return NextResponse.json(
      { error: "ニックネームを入力してください" },
      { status: 400 }
    );
  }

  if (!birthday_wish_name || typeof birthday_wish_name !== "string") {
    return NextResponse.json(
      { error: "誕生日のお祝いで読んでほしい名前を入力してください" },
      { status: 400 }
    );
  }

  const wishName = birthday_wish_name.trim();
  if (!wishName) {
    return NextResponse.json(
      { error: "誕生日のお祝いで読んでほしい名前を入力してください" },
      { status: 400 }
    );
  }

  if (isWithinTwoWeeksBeforeBirthday(existingProfile.birthday)) {
    if (wishName !== (existingProfile.birthday_wish_name ?? "").trim()) {
      return NextResponse.json(
        {
          error:
            "誕生日の2週間前からは読んでほしい名前の変更はできません",
        },
        { status: 400 }
      );
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      nickname: trimmedNickname,
      birthday_wish_name: wishName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
