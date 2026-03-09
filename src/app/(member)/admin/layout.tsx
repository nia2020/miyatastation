import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminLayoutClient } from "@/components/admin/AdminLayoutClient";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Admin layout profile error:", profileError);
      redirect("/dashboard");
    }

    if (profile?.role !== "admin" && profile?.role !== "poster") {
      redirect("/dashboard");
    }

    return (
      <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 -mt-6 sm:-mt-8 px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-6 sm:pb-8 bg-amber-50/80 dark:bg-amber-950/25 border-t-4 border-amber-500 dark:border-amber-600">
        <AdminLayoutClient role={profile?.role ?? "member"}>
          {children}
        </AdminLayoutClient>
      </div>
    );
  } catch (err) {
    console.error("Admin layout error:", err);
    redirect("/dashboard");
  }
}
