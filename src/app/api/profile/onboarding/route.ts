import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * 初回ログイン時のプロフィール入力を保存
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { nickname, birthday, birthday_wish_name } = body;

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

  if (!birthday) {
    return NextResponse.json(
      { error: "誕生日を入力してください" },
      { status: 400 }
    );
  }

  const d = new Date(birthday);
  if (isNaN(d.getTime())) {
    return NextResponse.json(
      { error: "誕生日の形式が不正です" },
      { status: 400 }
    );
  }
  const birthdayDate = d.toISOString().slice(0, 10);

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

  const { error } = await supabase
    .from("profiles")
    .update({
      nickname: trimmedNickname,
      birthday: birthdayDate,
      birthday_wish_name: wishName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
