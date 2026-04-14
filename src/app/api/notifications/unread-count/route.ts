import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { isUserNotificationsTableMissing } from "@/lib/notifications/supabase-error";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { count, error } = await supabase
    .from("user_notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null);

  if (error) {
    if (!isUserNotificationsTableMissing(error)) {
      console.error("notifications unread count:", error);
    }
    return NextResponse.json({ count: 0 });
  }

  return NextResponse.json({ count: count ?? 0 });
}
