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
      <AdminLayoutClient role={profile?.role ?? "member"}>
        {children}
      </AdminLayoutClient>
    );
  } catch (err) {
    console.error("Admin layout error:", err);
    redirect("/dashboard");
  }
}
