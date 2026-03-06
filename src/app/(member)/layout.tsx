import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding/OnboardingForm";
import { MemberHeader } from "@/components/layout/MemberHeader";

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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {needsOnboarding && <OnboardingForm />}
      <MemberHeader
        profile={profile ?? null}
        userEmail={user?.email ?? null}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-w-0 w-full overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
