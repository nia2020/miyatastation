import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/** いいねのトグル（押したら追加、もう一度押したら削除） */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { post_id } = body;

  if (!post_id) {
    return NextResponse.json(
      { error: "投稿IDは必須です" },
      { status: 400 }
    );
  }

  const { data: existing } = await supabase
    .from("post_likes")
    .select("id")
    .eq("post_id", post_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("post_likes")
      .delete()
      .eq("post_id", post_id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ liked: false });
  } else {
    const { data, error } = await supabase
      .from("post_likes")
      .insert({ post_id, user_id: user.id })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ liked: true, like: data });
  }
}
