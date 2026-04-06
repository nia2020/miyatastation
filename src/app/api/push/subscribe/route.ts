import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const b = body as {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };
  const endpoint = typeof b.endpoint === "string" ? b.endpoint.trim() : "";
  const p256dh = typeof b.keys?.p256dh === "string" ? b.keys.p256dh : "";
  const auth = typeof b.keys?.auth === "string" ? b.keys.auth : "";

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json(
      { error: "購読情報が不正です" },
      { status: 400 }
    );
  }

  try {
    const admin = createAdminClient();
    await admin.from("push_subscriptions").delete().eq("endpoint", endpoint);
  } catch {
    return NextResponse.json(
      { error: "サーバー設定を確認してください" },
      { status: 500 }
    );
  }

  const { error } = await supabase.from("push_subscriptions").insert({
    user_id: user.id,
    endpoint,
    p256dh,
    auth,
  });

  if (error) {
    console.error("push_subscriptions insert:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const endpoint = request.nextUrl.searchParams.get("endpoint");

  if (endpoint) {
    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("user_id", user.id)
      .eq("endpoint", endpoint);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("user_id", user.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
