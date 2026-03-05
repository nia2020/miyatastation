import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { OnboardingForm } from "@/components/onboarding/OnboardingForm";

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
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <Image
                  src="/logo.png"
                  alt="Miyata Station"
                  width={160}
                  height={53}
                  className="h-12 w-auto"
                  priority
                />
              </Link>
              <Link
                href="/dashboard"
                className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
              >
                トップに戻る
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/member-card"
                className="text-sm px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-lg font-medium hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
              >
                デジタル会員証
              </Link>
              {profile?.role === "admin" && (
                <Link
                  href="/admin"
                  className="text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium"
                >
                  管理画面
                </Link>
              )}
              {profile?.role === "poster" && (
                <Link
                  href="/admin/birthdays"
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
                >
                  お誕生日一覧
                </Link>
              )}
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {profile?.nickname?.trim() || profile?.full_name || user.email}
              </span>
              <form action="/api/auth/signout" method="post">
                <button
                  type="submit"
                  className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  ログアウト
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
