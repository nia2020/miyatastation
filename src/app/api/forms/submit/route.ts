import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { appendToSheet } from "@/lib/google-sheets";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "ログインが必要です" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { formThemeId, answers } = body;

    if (!formThemeId || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: "不正なリクエストです" },
        { status: 400 }
      );
    }

    const { data: formTheme } = await supabase
      .from("form_themes")
      .select("*")
      .eq("id", formThemeId)
      .eq("is_active", true)
      .single();

    if (!formTheme) {
      return NextResponse.json(
        { error: "フォームが見つかりません" },
        { status: 404 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const { data: existing } = await supabase
      .from("form_submissions")
      .select("id")
      .eq("user_id", user.id)
      .eq("form_theme_id", formThemeId)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "このフォームにはすでに回答済みです" },
        { status: 400 }
      );
    }

    await supabase.from("form_submissions").insert({
      user_id: user.id,
      form_theme_id: formThemeId,
      answers,
    });

    if (
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY &&
      process.env.GOOGLE_SPREADSHEET_ID
    ) {
      try {
        const row = [
          new Date().toISOString(),
          user.id,
          profile?.full_name ?? user.email ?? "",
          ...answers,
        ];
        await appendToSheet(row);
      } catch (sheetError) {
        console.error("Google Sheets append failed:", sheetError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Form submit error:", error);
    return NextResponse.json(
      { error: "送信に失敗しました" },
      { status: 500 }
    );
  }
}
