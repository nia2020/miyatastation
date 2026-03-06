import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let newFlags = { events: false, forms: false, chat: false };
  try {
    const [contentUpdates, userViews] = await Promise.all([
      Promise.all([
        supabase.from("events").select("updated_at").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("site_config").select("updated_at").eq("key", "message_collection_forms").maybeSingle(),
        supabase.from("admin_posts").select("created_at").order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]),
      supabase.from("user_section_views").select("section, last_viewed_at").eq("user_id", user.id),
    ]);
    const lastViewedMap = Object.fromEntries(
      (userViews.data ?? []).map((r) => [r.section, r.last_viewed_at])
    );
    const eventsLastUpdate = contentUpdates[0].data?.updated_at;
    const formsLastUpdate = contentUpdates[1].data?.updated_at;
    const chatLastUpdate = contentUpdates[2].data?.created_at;
    newFlags = {
      events: !!eventsLastUpdate && new Date(eventsLastUpdate) > new Date(lastViewedMap.events ?? 0),
      forms: !!formsLastUpdate && new Date(formsLastUpdate) > new Date(lastViewedMap.forms ?? 0),
      chat: !!chatLastUpdate && new Date(chatLastUpdate) > new Date(lastViewedMap.chat ?? 0),
    };
  } catch {
    // user_section_views テーブルが無い場合など
  }

  return <DashboardShell newFlags={newFlags}>{children}</DashboardShell>;
}
