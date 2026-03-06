import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export type MessageForm = { title: string; url: string; description?: string };

function parseForms(value: string | null): MessageForm[] {
  if (!value?.trim()) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (f): f is MessageForm =>
          f && typeof f === "object" && typeof (f as MessageForm).title === "string" && typeof (f as MessageForm).url === "string"
      )
      .map((f) => ({
        title: (f as MessageForm).title,
        url: (f as MessageForm).url,
        description: typeof (f as MessageForm).description === "string" ? (f as MessageForm).description : "",
      }));
  } catch {
    return [];
  }
}

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

  let forms = parseForms(config?.message_collection_forms ?? null);

  if (forms.length === 0) {
    const legacyUrl = config?.google_form_url?.trim();
    const legacyTitle = config?.message_collection_title?.trim();
    if (legacyUrl) {
      forms = [{ title: legacyTitle || "メッセージ募集", url: legacyUrl, description: "" }];
    }
  }

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
    ? forms
        .filter(
          (f: unknown) =>
            f && typeof f === "object" && typeof (f as MessageForm).title === "string" && typeof (f as MessageForm).url === "string"
        )
        .map((f: MessageForm) => ({
          title: String(f.title).trim(),
          url: String(f.url).trim(),
          description: typeof f.description === "string" ? String(f.description).trim() : "",
        }))
        .filter((f) => f.url)
    : [];

  const upserts: { key: string; value: string; updated_at: string }[] = [
    {
      key: "message_collection_forms",
      value: JSON.stringify(validForms),
      updated_at: new Date().toISOString(),
    },
    {
      key: "announcement",
      value: typeof announcement === "string" ? String(announcement).trim() : "",
      updated_at: new Date().toISOString(),
    },
  ];

  for (const row of upserts) {
    const { error } = await supabase.from("site_config").upsert(row, {
      onConflict: "key",
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
