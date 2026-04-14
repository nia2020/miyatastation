import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { notifyPostAuthorOfNewComment } from "@/lib/push/comment-notification";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { post_id, content } = body;

  if (!post_id || !content?.trim()) {
    return NextResponse.json(
      { error: "投稿IDとコメント内容は必須です" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("post_comments")
    .insert({
      post_id,
      user_id: user.id,
      content: content.trim(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  void notifyPostAuthorOfNewComment({
    postId: post_id as string,
    commenterUserId: user.id,
    commentText: content.trim(),
  }).catch((err) => console.error("comment push notify:", err));

  return NextResponse.json({ comment: data });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({ error: "IDが必要です" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const { data: comment } = await supabase
    .from("post_comments")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!comment) {
    return NextResponse.json({ error: "コメントが見つかりません" }, { status: 404 });
  }

  const canDelete =
    profile?.role === "admin" || comment.user_id === user.id;

  if (!canDelete) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase.from("post_comments").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
