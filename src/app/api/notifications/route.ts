import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { isUserNotificationsTableMissing } from "@/lib/notifications/supabase-error";

const LIMIT = 80;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: rows, error } = await supabase
    .from("user_notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(LIMIT);

  if (error) {
    if (isUserNotificationsTableMissing(error)) {
      return NextResponse.json({ notifications: [] });
    }
    console.error("notifications list:", error);
    return NextResponse.json(
      { error: "Failed to load notifications" },
      { status: 500 }
    );
  }

  return NextResponse.json({ notifications: rows ?? [] });
}
