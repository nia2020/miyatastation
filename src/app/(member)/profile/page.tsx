import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname, birthday, birthday_wish_name, avatar_url, role, created_at")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/dashboard");

  const isAdminOrPoster = profile.role === "admin" || profile.role === "poster";
  const joinedAt = profile.created_at ? new Date(profile.created_at) : null;
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  const isMember12MonthsOrMore =
    joinedAt && joinedAt <= twelveMonthsAgo;
  const canSetAvatar = isAdminOrPoster || !!isMember12MonthsOrMore;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
        プロフィール編集
      </h2>
      <ProfileEditForm
        initialNickname={profile.nickname ?? ""}
        initialBirthday={profile.birthday ?? ""}
        initialBirthdayWishName={profile.birthday_wish_name ?? ""}
        initialAvatarUrl={profile.avatar_url ?? ""}
        canSetAvatar={canSetAvatar}
      />
    </div>
  );
}
