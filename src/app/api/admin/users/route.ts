import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

/**
 * アカウント一覧を取得（管理者のみ）
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

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .select("id, email, full_name, member_number, role, nickname, birthday, birthday_wish_name, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ users: data ?? [] });
  } catch (err) {
    console.error("Users list error:", err);
    return NextResponse.json(
      { error: "アカウント一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

/**
 * 会員番号・登録日を更新（管理者のみ）
 */
export async function PATCH(request: NextRequest) {
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
  const { userId, member_number, role, created_at } = body;

  if (!userId) {
    return NextResponse.json(
      { error: "ユーザーIDが必要です" },
      { status: 400 }
    );
  }

  const updates: {
    member_number?: string;
    role?: "member" | "admin" | "poster";
    created_at?: string;
    updated_at: string;
  } = {
    updated_at: new Date().toISOString(),
  };

  if (role !== undefined) {
    if (role !== "member" && role !== "admin" && role !== "poster") {
      return NextResponse.json(
        { error: "役割は「member」「admin」「poster」のいずれかを指定してください" },
        { status: 400 }
      );
    }
    updates.role = role;
  }

  if (member_number !== undefined) {
    if (!member_number || typeof member_number !== "string") {
      return NextResponse.json(
        { error: "会員番号は必須です" },
        { status: 400 }
      );
    }
    updates.member_number = member_number.trim();
  }

  if (created_at !== undefined) {
    const date = new Date(created_at);
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { error: "登録日の形式が不正です" },
        { status: 400 }
      );
    }
    updates.created_at = date.toISOString();
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "この会員番号は既に使用されています" },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile: data });
  } catch (err) {
    console.error("Profile update error:", err);
    return NextResponse.json(
      { error: "更新に失敗しました" },
      { status: 500 }
    );
  }
}

/**
 * 管理者がアカウントを発行する API
 * 管理者のみが呼び出せ、auth.admin.createUser でユーザーを作成する。
 * handle_new_user トリガーにより profiles が自動作成される。
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
  const { email, password, full_name, member_number, created_at } = body;

  if (!email || !password) {
    return NextResponse.json(
      { error: "メールアドレスとパスワードは必須です" },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "パスワードは6文字以上で入力してください" },
      { status: 400 }
    );
  }

  const memberNumber =
    member_number && typeof member_number === "string"
      ? member_number.trim()
      : null;

  let createdAt: string | null = null;
  if (created_at) {
    const d = new Date(created_at);
    if (!isNaN(d.getTime())) createdAt = d.toISOString();
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name || "会員",
      },
    });

    if (error) {
      if (error.message.includes("already been registered")) {
        return NextResponse.json(
          { error: "このメールアドレスは既に登録されています" },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // handle_new_user トリガーで profiles が作成されるため、会員番号・入会年月を更新
    const profileUpdates: {
      member_number?: string;
      created_at?: string;
      updated_at: string;
    } = { updated_at: new Date().toISOString() };
    if (memberNumber) profileUpdates.member_number = memberNumber;
    if (createdAt) profileUpdates.created_at = createdAt;

    const { error: updateError } = await admin
      .from("profiles")
      .update(profileUpdates)
      .eq("id", data.user.id);

    if (updateError) {
      if (updateError.code === "23505") {
        return NextResponse.json(
          { error: "この会員番号は既に使用されています" },
          { status: 400 }
        );
      }
      console.error("Profile update after create:", updateError);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        full_name: full_name || "会員",
      },
    });
  } catch (err) {
    console.error("Account creation error:", err);
    return NextResponse.json(
      { error: "アカウント発行中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
