import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

function parseUsageGuide(value: string | null): string[] {
  if (!value?.trim()) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is string => typeof item === "string")
      .map((s) => String(s).trim())
      .filter(Boolean);
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

  const { data: row } = await supabase
    .from("site_config")
    .select("value")
    .eq("key", "usage_guide")
    .maybeSingle();

  const items = parseUsageGuide(row?.value ?? null);
  return NextResponse.json({ items });
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
  const { items } = body;

  const validItems: string[] = Array.isArray(items)
    ? items
        .map((item: unknown) => (typeof item === "string" ? String(item).trim() : ""))
        .filter(Boolean)
    : [];

  const { error } = await supabase.from("site_config").upsert(
    {
      key: "usage_guide",
      value: JSON.stringify(validItems),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
