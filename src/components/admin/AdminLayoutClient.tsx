"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

type AdminLayoutClientProps = {
  role: "admin" | "poster" | "member";
  children: React.ReactNode;
};

export function AdminLayoutClient({ role, children }: AdminLayoutClientProps) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (role === "poster" && pathname !== "/admin/birthdays") {
      router.replace("/admin/birthdays");
    }
  }, [role, pathname, router]);

  const isPoster = role === "poster";

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">
          {isPoster ? "お誕生日一覧" : "管理画面"}
        </h1>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 font-medium"
          >
            ダッシュボードに戻る
          </Link>
          {isPoster ? (
            <Link
              href="/admin/birthdays"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 font-medium"
            >
              お誕生日一覧
            </Link>
          ) : (
            <>
              <Link
                href="/admin"
                className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 font-medium"
              >
                管理TOP
              </Link>
              <Link
                href="/admin/users"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 font-medium"
              >
                アカウント発行
              </Link>
              <Link
                href="/admin/events"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 font-medium"
              >
                イベント管理
              </Link>
              <Link
                href="/admin/forms"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 font-medium"
              >
                フォーム管理
              </Link>
              <Link
                href="/admin/birthdays"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 font-medium"
              >
                お誕生日一覧
              </Link>
            </>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}
