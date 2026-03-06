import { createClient } from "@/lib/supabase/server";
import { MemberCardDisplay } from "@/components/member-card/MemberCardDisplay";
import { SidebarLayout } from "@/components/layout/SidebarLayout";

export default async function MemberCardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return (
    <SidebarLayout currentPage="member-card">
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
          デジタル会員証
        </h2>
        <MemberCardDisplay
          memberName={profile.full_name}
          memberNumber={profile.member_number}
          joinedAt={profile.created_at}
        />
      </div>
    </SidebarLayout>
  );
}
