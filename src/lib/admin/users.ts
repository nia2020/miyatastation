import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminUser = {
  id: string;
  email: string;
  full_name: string;
  member_number: string;
  role: string;
  nickname: string | null;
  birthday: string | null;
  birthday_wish_name: string | null;
  created_at: string;
  must_change_password: boolean;
};

/**
 * 管理者がアカウント一覧を取得（サーバーサイド用）
 * 管理者でない場合やエラー時は null を返す
 */
export async function getUsersForAdmin(): Promise<AdminUser[] | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") return null;

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .select("id, email, full_name, member_number, role, nickname, birthday, birthday_wish_name, created_at, must_change_password")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("getUsersForAdmin error:", error);
      return null;
    }

    return (data ?? []) as AdminUser[];
  } catch (err) {
    console.error("getUsersForAdmin error:", err);
    return null;
  }
}
