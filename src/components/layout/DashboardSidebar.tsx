import Link from "next/link";

const SECTIONS = [
  { id: "events", label: "イベント情報", href: "/dashboard?section=events" },
  { id: "forms", label: "メッセージ募集", href: "/dashboard?section=forms" },
  { id: "chat", label: "タイムライン", href: "/dashboard?section=chat" },
] as const;

const PAGES = [
  { id: "member-card", label: "デジタル会員証", href: "/member-card" },
  { id: "profile", label: "プロフィール編集", href: "/profile" },
] as const;

interface DashboardSidebarProps {
  currentPage?: "dashboard" | "member-card" | "profile";
  currentSection?: string;
}

export function DashboardSidebar({
  currentPage = "dashboard",
  currentSection,
}: DashboardSidebarProps) {
  return (
    <aside className="w-48 shrink-0">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">ダッシュボード</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">メンバー専用サイト</p>
      <nav className="mt-6 flex flex-col gap-1">
        {SECTIONS.map(({ id, label, href }) => (
          <Link
            key={id}
            href={href}
            className={`block rounded-lg px-4 py-3 text-left font-medium transition-colors ${
              currentPage === "dashboard" && (currentSection || "events") === id
                ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            {label}
          </Link>
        ))}
        <div className="my-2 border-t border-slate-200 dark:border-slate-700" />
        {PAGES.map(({ id, label, href }) => (
          <Link
            key={id}
            href={href}
            className={`block rounded-lg px-4 py-3 text-left font-medium transition-colors ${
              currentPage === id
                ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
