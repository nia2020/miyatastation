"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, Bell } from "lucide-react";

function HeaderNotificationsBell() {
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/unread-count");
      if (!res.ok) return;
      const data = await res.json();
      setUnread(typeof data.count === "number" ? data.count : 0);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh, pathname]);

  useEffect(() => {
    const t = setInterval(() => void refresh(), 60000);
    return () => clearInterval(t);
  }, [refresh]);

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <Link
      href="/dashboard/notifications"
      className="relative p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
      aria-label="お知らせ"
    >
      <Bell className="h-5 w-5" />
      {unread > 0 ? (
        <>
          <span className="absolute top-1 right-1 min-w-[1.125rem] h-[1.125rem] px-1 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
            {unread > 99 ? "99+" : unread}
          </span>
        </>
      ) : null}
    </Link>
  );
}

interface MemberHeaderProps {
  profile?: {
    nickname?: string | null;
    full_name?: string | null;
    role?: string | null;
  } | null;
  userEmail?: string | null;
}

export function MemberHeader({ profile }: MemberHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0"
            >
              <Image
                src="/mascot.png"
                alt=""
                width={40}
                height={40}
                className="h-8 w-8 sm:h-10 sm:w-10 object-contain"
                aria-hidden
              />
              <Image
                src="/logo.png"
                alt="Miyata Station"
                width={160}
                height={53}
                className="h-8 sm:h-12 w-auto object-contain"
                priority
              />
            </Link>
            <Link
              href="/dashboard"
              className="hidden sm:inline text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
            >
              トップに��る
            </Link>
          </div>

          <div className="flex items-center gap-1 md:gap-3 lg:gap-4 shrink-0">
            <HeaderNotificationsBell />
            <div className="hidden md:flex items-center gap-3 lg:gap-4">
              <Link
                href="/member-card"
                className="text-sm px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-lg font-medium hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors whitespace-nowrap"
              >
                デジタル会員証
              </Link>
              <Link
                href="/profile"
                className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium whitespace-nowrap"
              >
                プロフィール編集
              </Link>
              {profile?.role === "admin" && (
                <Link
                  href="/admin"
                  className="text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium whitespace-nowrap"
                >
                  管理画面
                </Link>
              )}
              {profile?.role === "poster" && (
                <Link
                  href="/admin/birthdays"
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium whitespace-nowrap"
                >
                  お誕生日一覧
                </Link>
              )}
              <form action="/api/auth/signout" method="post" className="shrink-0">
                <button
                  type="submit"
                  className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 whitespace-nowrap"
                >
                  ログアウト
                </button>
              </form>
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((o) => !o)}
              className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-expanded={mobileMenuOpen}
              aria-label="メニューを開く"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex flex-col gap-1">
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
              >
                トップに戻る
              </Link>
              <Link
                href="/dashboard/notifications"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
              >
                お知らせ
              </Link>
              <Link
                href="/member-card"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-medium"
              >
                デジタル会員証
              </Link>
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
              >
                プロフィール編集
              </Link>
              {profile?.role === "admin" && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
                >
                  管理画面
                </Link>
              )}
              {profile?.role === "poster" && (
                <Link
                  href="/admin/birthdays"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
                >
                  お誕生日一覧
                </Link>
              )}
              <form action="/api/auth/signout" method="post" className="border-t border-slate-200 dark:border-slate-700 mt-2 pt-3">
                <button
                  type="submit"
                  className="w-full text-left px-4 py-3 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  ログアウト
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
