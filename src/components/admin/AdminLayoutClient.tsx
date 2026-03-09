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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200 shrink-0">
          {isPoster ? "お誕生日一覧" : "管理画面"}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard"
            className="whitespace-nowrap px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-amber-300 dark:border-amber-700 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/30 font-medium"
          >
            ダッシュボードに戻る
          </Link>
          {isPoster ? (
            <Link
              href="/admin/birthdays"
              className="whitespace-nowrap px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 font-medium"
            >
              お誕生日一覧
            </Link>
          ) : (
            <>
              <Link
                href="/admin"
                className="whitespace-nowrap px-4 py-2 bg-amber-200 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 rounded-lg hover:bg-amber-300 dark:hover:bg-amber-800/50 font-medium"
              >
                管理TOP
              </Link>
              <Link
                href="/admin/users"
                className="whitespace-nowrap px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 font-medium"
              >
                アカウント発行
              </Link>
              <Link
                href="/admin/events"
                className="whitespace-nowrap px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 font-medium"
              >
                イベント管理
              </Link>
              <Link
                href="/admin/forms"
                className="whitespace-nowrap px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 font-medium"
              >
                フォーム管理
              </Link>
              <Link
                href="/admin/birthdays"
                className="whitespace-nowrap px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 font-medium"
              >
                お誕生日一覧
              </Link>
              <Link
                href="/admin/archive-videos"
                className="whitespace-nowrap px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 font-medium"
              >
                アーカイブ動画
              </Link>
            </>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}
