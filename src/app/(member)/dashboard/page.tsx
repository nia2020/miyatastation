import { createClient } from "@/lib/supabase/server";
import { DashboardHomeContent } from "@/components/dashboard/DashboardHomeContent";

export const dynamic = "force-dynamic";

export default async function DashboardHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [{ data: profile }, { data: announcementRow }] = await Promise.all([
    supabase.from("profiles").select("nickname, full_name, avatar_url").eq("id", user.id).maybeSingle(),
    supabase.from("site_config").select("value").eq("key", "announcement").maybeSingle(),
  ]);

  const displayName =
    profile?.nickname?.trim() || profile?.full_name || "会員";
  const announcement = announcementRow?.value?.trim() ?? "";

  return (
    <DashboardHomeContent
      displayName={displayName}
      announcement={announcement}
      avatarUrl={profile?.avatar_url ?? null}
    />
  );
}
