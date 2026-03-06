"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { DashboardSidebar } from "./DashboardSidebar";

interface SidebarLayoutProps {
  children: React.ReactNode;
  currentPage: "member-card" | "profile";
}

export function SidebarLayout({ children, currentPage }: SidebarLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col lg:flex-row lg:gap-8 gap-6">
      {/* デスクトップ: 常時表示 */}
      <div className="hidden lg:block shrink-0">
        <DashboardSidebar currentPage={currentPage} />
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
                onLinkClick={() => setMobileMenuOpen(false)}
              />
            </div>
          </div>
        </>
      )}

      {/* メインコンテンツ */}
      <main className="min-w-0 flex-1">{children}</main>

      {/* モバイル: メニューボタン（FAB） */}
      <button
        type="button"
        onClick={() => setMobileMenuOpen(true)}
        className="fixed bottom-6 right-6 z-30 lg:hidden flex items-center justify-center w-14 h-14 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 active:scale-95 transition-all"
        aria-label="メニューを開く"
      >
        <Menu className="h-6 w-6" />
      </button>
    </div>
  );
}
