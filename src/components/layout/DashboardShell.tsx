"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { DashboardSidebar } from "./DashboardSidebar";
import { BannerLinks } from "./BannerLinks";
import { SectionViewTracker } from "@/components/dashboard/SectionViewTracker";

type SectionId = "home" | "events" | "forms" | "chat";

interface DashboardShellProps {
  children: React.ReactNode;
  newFlags: { events: boolean; forms: boolean; chat: boolean };
}

export function DashboardShell({ children, newFlags }: DashboardShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentSection: SectionId =
    pathname === "/dashboard/events"
      ? "events"
      : pathname === "/dashboard/forms"
        ? "forms"
        : pathname === "/dashboard/chat"
          ? "chat"
          : "home";

  const currentPage =
    pathname === "/member-card"
      ? "member-card"
      : pathname === "/profile"
        ? "profile"
        : pathname === "/dashboard/archive-videos"
          ? "archive-videos"
          : "dashboard";

  return (
    <>
      <SectionViewTracker />
      <div className="flex flex-col lg:flex-row lg:gap-8 gap-6">
        {/* デスクトップ: 常時表示 */}
        <div className="hidden lg:block shrink-0">
          <DashboardSidebar
            currentPage={currentPage}
            currentSection={currentSection}
            newFlags={newFlags}
          />
        </div>

        {/* モバイル: ドロワーオーバーレイ */}
        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden
            />
            <div className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white dark:bg-slate-900 shadow-xl lg:hidden overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  メニュー
                </span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="メニューを閉じる"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4">
                <DashboardSidebar
                  currentPage={currentPage}
                  currentSection={currentSection}
                  newFlags={newFlags}
                  onLinkClick={() => setMobileMenuOpen(false)}
                />
              </div>
            </div>
          </>
        )}

        {/* メインコンテンツ */}
        <div className="min-w-0 flex-1 space-y-8">
          {children}
          <BannerLinks />
        </div>
      </div>

      {/* モバイル: メニューボタン（FAB） */}
      <button
        type="button"
        onClick={() => setMobileMenuOpen(true)}
        className="fixed bottom-6 right-6 z-30 lg:hidden flex items-center justify-center w-14 h-14 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 active:scale-95 transition-all"
        aria-label="メニューを開く"
      >
        <Menu className="h-6 w-6" />
      </button>
    </>
  );
}
