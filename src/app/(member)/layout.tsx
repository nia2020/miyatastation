import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding/OnboardingForm";
import { MemberHeader } from "@/components/layout/MemberHeader";
import { MemberContentWrapper } from "@/components/layout/MemberContentWrapper";

export const dynamic = "force-dynamic";

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user;
  let profile;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data?.user;
    if (!user) {
      redirect("/login");
    }
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    if (profileError) {
      console.error("Member layout profile error:", profileError);
    }
    profile = profileData ?? undefined;
  } catch {
    redirect("/login");
  }

  const needsOnboarding = profile && !profile.nickname?.trim();

  const supabase = await createClient();
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {needsOnboarding && <OnboardingForm />}
      <MemberHeader
        profile={profile ?? null}
        userEmail={user?.email ?? null}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-w-0 w-full overflow-x-hidden">
        <MemberContentWrapper newFlags={newFlags}>{children}</MemberContentWrapper>
      </main>
    </div>
  );
}
