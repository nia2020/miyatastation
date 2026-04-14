import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding/OnboardingForm";
import { MemberHeader } from "@/components/layout/MemberHeader";
import { MemberContentWrapper } from "@/components/layout/MemberContentWrapper";
import { MemberFlagsLayout } from "@/components/layout/MemberFlagsLayout";

export const dynamic = "force-dynamic";

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  let user;
  let profile;
  let newFlags = {
    events: false,
    messageCollection: false,
    googleForms: false,
    chat: false,
    archiveVideos: false,
  };

  try {
    const { data } = await supabase.auth.getUser();
    user = data?.user;
    if (!user) {
      redirect("/login");
    }
  } catch {
    redirect("/login");
  }

  try {
    const [profileResult, contentUpdates, userViews] = await Promise.all([
      supabase.from("profiles").select("*, must_change_password").eq("id", user!.id).maybeSingle(),
      Promise.all([
        supabase.from("events").select("updated_at").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
        supabase
          .from("site_config")
          .select("key, value, updated_at")
          .in("key", ["message_collection_forms", "google_form_url"]),
        supabase.from("admin_posts").select("created_at").order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase
          .from("archive_videos")
          .select("updated_at")
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]),
      supabase.from("user_section_views").select("section, last_viewed_at").eq("user_id", user!.id),
    ]);
    const { data: profileData, error: profileError } = profileResult;
    if (profileError) {
      console.error("Member layout profile error:", profileError);
    }
    profile = profileData ?? undefined;
    const lastViewedMap = Object.fromEntries(
      (userViews.data ?? []).map((r) => [r.section, r.last_viewed_at])
    );
    const eventsLastUpdate = contentUpdates[0].data?.updated_at;
    const siteConfigRows = contentUpdates[1].data ?? [];
    const siteConfigMap = Object.fromEntries(
      siteConfigRows.map((r: { key: string; value: string | null; updated_at: string }) => [r.key, r])
    );
    const formsRow = siteConfigMap.message_collection_forms;
    const googleRow = siteConfigMap.google_form_url;
    let hasMessageCollectionContent = false;
    if (formsRow?.value?.trim()) {
      try {
        const arr = JSON.parse(formsRow.value) as unknown;
        if (Array.isArray(arr)) {
          hasMessageCollectionContent = arr.some(
            (f: unknown) =>
              f &&
              typeof f === "object" &&
              typeof (f as { url?: string }).url === "string" &&
              (f as { url: string }).url.trim()
          );
        }
      } catch {
        /* ignore */
      }
    }
    const hasGoogleFormContent = !!googleRow?.value?.trim();
    const msgLastUpdate = formsRow?.updated_at ?? null;
    const googleLastUpdate = googleRow?.updated_at ?? null;
    const legacyFormsViewed = lastViewedMap.forms;
    const msgViewedAt = lastViewedMap.message_collection ?? legacyFormsViewed;
    const googleViewedAt = lastViewedMap.google_forms ?? legacyFormsViewed;
    const chatLastUpdate = contentUpdates[2].data?.created_at;
    const archiveLastUpdate = contentUpdates[3].data?.updated_at;
    newFlags = {
      events: !!eventsLastUpdate && new Date(eventsLastUpdate) > new Date(lastViewedMap.events ?? 0),
      messageCollection:
        !!msgLastUpdate &&
        new Date(msgLastUpdate) > new Date(msgViewedAt ?? 0) &&
        hasMessageCollectionContent,
      googleForms:
        !!googleLastUpdate &&
        new Date(googleLastUpdate) > new Date(googleViewedAt ?? 0) &&
        hasGoogleFormContent,
      chat: !!chatLastUpdate && new Date(chatLastUpdate) > new Date(lastViewedMap.chat ?? 0),
      archiveVideos:
        !!archiveLastUpdate &&
        new Date(archiveLastUpdate) > new Date(lastViewedMap.archive_videos ?? 0),
    };
  } catch (e) {
    console.error("Member layout content fetch error:", e);
  }

  if (profile?.must_change_password) {
    redirect("/change-password");
  }

  const needsOnboarding = profile && !profile.nickname?.trim();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {needsOnboarding && <OnboardingForm />}
      <MemberFlagsLayout newFlags={newFlags}>
        <MemberHeader
          profile={profile ?? null}
          userEmail={user?.email ?? null}
        />

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-w-0 w-full overflow-x-hidden">
          <MemberContentWrapper newFlags={newFlags}>{children}</MemberContentWrapper>
        </main>
      </MemberFlagsLayout>
    </div>
  );
}
