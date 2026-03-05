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

  const canPost =
    profile?.role === "admin" || profile?.role === "poster";
  if (!canPost) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { id, title, content, images } = body;

  if (!title || !content) {
    return NextResponse.json(
      { error: "タイトルと本文は必須です" },
      { status: 400 }
    );
  }

  const imageUrls = Array.isArray(images)
    ? images.filter((u: unknown) => typeof u === "string" && u.startsWith("http"))
    : [];

  const postData = {
    title,
    content,
    images: imageUrls,
    author_id: user.id,
    updated_at: new Date().toISOString(),
  };

  if (id) {
    // 投稿者は自分の投稿のみ編集可能
    if (profile?.role === "poster") {
      const { data: existing } = await supabase
        .from("admin_posts")
        .select("author_id")
        .eq("id", id)
        .single();
      if (!existing || existing.author_id !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    const { data, error } = await supabase
      .from("admin_posts")
      .update(postData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ post: data });
  } else {
    const { data, error } = await supabase
      .from("admin_posts")
      .insert(postData)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ post: data });
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

  const isAdmin = profile?.role === "admin";
  const isPoster = profile?.role === "poster";
  if (!isAdmin && !isPoster) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({ error: "IDが必要です" }, { status: 400 });
  }

  // 投稿者は自分の投稿のみ削除可能
  if (isPoster) {
    const { data: existing } = await supabase
      .from("admin_posts")
      .select("author_id")
      .eq("id", id)
      .single();
    if (!existing || existing.author_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { error } = await supabase.from("admin_posts").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
