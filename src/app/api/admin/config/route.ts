import { createClient } from "@/lib/supabase/server";
import { coerceMessageForm, parseMessageForms, type MessageForm } from "@/lib/forms";
import { NextRequest, NextResponse } from "next/server";

export type { MessageForm };

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

  const { data: rows, error } = await supabase
    .from("site_config")
    .select("key, value")
    .in("key", [
      "message_collection_forms",
      "google_form_url",
      "message_collection_title",
      "announcement",
    ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const config = rows?.reduce(
    (acc, r) => {
      acc[r.key] = r.value;
      return acc;
    },
    {} as Record<string, string | null>
  );

  const forms = parseMessageForms(config);

  return NextResponse.json({
    forms,
    announcement: config?.announcement?.trim() ?? "",
  });
}

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
  const { forms, announcement } = body;

  const validForms: MessageForm[] = Array.isArray(forms)
    ? forms.map(coerceMessageForm).filter((f): f is MessageForm => f !== null)
    : [];

  const newFormsValue = JSON.stringify(validForms);
  const newAnnouncementValue = typeof announcement === "string" ? String(announcement).trim() : "";

  const { data: existingRows } = await supabase
    .from("site_config")
    .select("key, value")
    .in("key", ["message_collection_forms", "announcement"]);

  const existingMap = Object.fromEntries(
    (existingRows ?? []).map((r) => [r.key, r.value ?? ""])
  );
  const now = new Date().toISOString();

  if (existingMap.message_collection_forms !== newFormsValue) {
    const { error } = await supabase.from("site_config").upsert(
      { key: "message_collection_forms", value: newFormsValue, updated_at: now },
      { onConflict: "key" }
    );
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  if (existingMap.announcement !== newAnnouncementValue) {
    const { error } = await supabase.from("site_config").upsert(
      { key: "announcement", value: newAnnouncementValue, updated_at: now },
      { onConflict: "key" }
    );
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
