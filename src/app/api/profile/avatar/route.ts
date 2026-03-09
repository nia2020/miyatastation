import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

const BUCKET = "post-images";

/** 投稿者・管理者のみアイコン画像をアップロード可能 */
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
    return NextResponse.json(
      { error: "アイコン画像の設定は投稿者・管理者のみ可能です" },
      { status: 403 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file || !file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "画像ファイルを選択してください" },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `avatars/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { data, error } = await adminSupabase.storage
      .from(BUCKET)
      .upload(path, file, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("Avatar upload error:", error);
      return NextResponse.json(
        { error: error.message || "アップロードに失敗しました" },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = adminSupabase.storage.from(BUCKET).getPublicUrl(data.path);

    await supabase
      .from("profiles")
      .update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error("Avatar upload error:", err);
    return NextResponse.json(
      { error: "アップロードに失敗しました" },
      { status: 500 }
    );
  }
}

/** アイコン画像を削除（投稿者・管理者のみ） */
export async function DELETE() {
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
    return NextResponse.json(
      { error: "アイコン画像の削除は投稿者・管理者のみ可能です" },
      { status: 403 }
    );
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      avatar_url: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
