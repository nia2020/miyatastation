"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, Bell } from "lucide-react";
import { useNewFlags } from "@/contexts/NewFlagsContext";

function HeaderNotifications() {
  const pathname = usePathname();
  const newFlags = useNewFlags();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (pathname.startsWith("/admin")) {
    return null;
  }

  const hasAny =
    newFlags.events ||
    newFlags.messageCollection ||
    newFlags.googleForms ||
    newFlags.chat ||
    newFlags.archiveVideos ||
    newFlags.mkRoom ||
    newFlags.usageGuide;
  const items = [
    {
      key: "events",
      label: "イベント情報",
      href: "/dashboard/events",
      isNew: newFlags.events,
    },
    {
      key: "forms",
      label: "各種フォーム",
      href: "/dashboard/forms",
      isNew: newFlags.messageCollection || newFlags.googleForms,
    },
    {
      key: "chat",
      label: "フィード",
      href: "/dashboard/chat",
      isNew: newFlags.chat,
    },
    {
      key: "mk-room",
      label: "MK ROOM",
      href: "/dashboard/mk-room",
      isNew: newFlags.mkRoom,
    },
    {
      key: "archive-videos",
      label: "アーカイブ動画",
      href: "/dashboard/archive-videos",
      isNew: newFlags.archiveVideos,
    },
    {
      key: "usage-guide",
      label: "ご利用案内",
      href: "/dashboard/usage-guide",
      isNew: newFlags.usageGuide,
    },
  ] as const;

  return (
    <div className="relative shrink-0" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        aria-label="更新のお知らせ"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell className="h-5 w-5" />
        {hasAny ? (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
        ) : null}
      </button>
      {open ? (
        <div
          className="absolute right-0 mt-1 w-64 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg z-50 py-2 text-left"
          role="menu"
        >
          <p className="px-3 pt-1 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            コンテンツの更新
          </p>
          <ul className="flex flex-col gap-0.5">
            {items.map(({ key, label, href, isNew }) => (
              <li key={key}>
                <Link
                  href={href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between gap-2 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <span>{label}</span>
                  {isNew ? (
                    <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded">
                      NEW
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
          {!hasAny ? (
            <p className="px-3 pt-2 pb-1 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 mt-1">
              新しい更新はありません
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
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
              {"\u30c8\u30c3\u30d7\u306b\u623b\u308b"}
            </Link>
          </div>

          <div className="flex items-center gap-1 md:gap-3 lg:gap-4 shrink-0">
            <HeaderNotifications />
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

        {/* モバイル: ドロップダウンメニュー */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex flex-col gap-1">
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
              >
              {"\u30c8\u30c3\u30d7\u306b\u623b\u308b"}
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
