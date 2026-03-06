import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname, birthday, birthday_wish_name")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/dashboard");

  return (
    <div className="flex flex-col lg:flex-row lg:gap-8 gap-6">
      <DashboardSidebar currentPage="profile" />
      <main className="min-w-0 flex-1">
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
            プロフィール編集
          </h2>
          <ProfileEditForm
            initialNickname={profile.nickname ?? ""}
            initialBirthday={profile.birthday ?? ""}
            initialBirthdayWishName={profile.birthday_wish_name ?? ""}
          />
        </div>
      </main>
    </div>
  );
}
