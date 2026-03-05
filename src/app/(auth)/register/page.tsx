import { redirect } from "next/navigation";

/**
 * 一般会員登録は無効。アカウントは管理者のみが発行可能。
 * /register にアクセスした場合はログインページへリダイレクト。
 */
export const dynamic = "force-dynamic";

export default function RegisterPage() {
  redirect("/login");
}
