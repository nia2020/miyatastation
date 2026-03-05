import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

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
  const { id, theme, questions, week_start, is_active } = body;

  if (!theme || !Array.isArray(questions) || !week_start) {
    return NextResponse.json(
      { error: "テーマ、質問、週の開始日は必須です" },
      { status: 400 }
    );
  }

  const filteredQuestions = questions.filter((q: string) => q?.trim());

  if (filteredQuestions.length === 0) {
    return NextResponse.json(
      { error: "少なくとも1つの質問が必要です" },
      { status: 400 }
    );
  }

  const formData = {
    theme,
    questions: filteredQuestions,
    week_start: new Date(week_start).toISOString().slice(0, 10),
    is_active: is_active ?? true,
    updated_at: new Date().toISOString(),
  };

  if (id) {
    const { data, error } = await supabase
      .from("form_themes")
      .update(formData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ formTheme: data });
  } else {
    const { data, error } = await supabase
      .from("form_themes")
      .insert(formData)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ formTheme: data });
  }
}

export async function DELETE(request: NextRequest) {
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
  const { id } = body;

  if (!id) {
    return NextResponse.json({ error: "IDが必要です" }, { status: 400 });
  }

  const { error } = await supabase.from("form_themes").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
