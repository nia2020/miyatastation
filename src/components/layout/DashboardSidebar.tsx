import Link from "next/link";
import Image from "next/image";
import {
  Home,
  Calendar,
  MessageSquare,
  Hash,
  CreditCard,
  UserCircle,
  Video,
  FileText,
  Bell,
} from "lucide-react";
import { useNewFlags } from "@/contexts/NewFlagsContext";

function MiyataLogoIcon({ className }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt=""
      width={80}
      height={80}
      quality={90}
      className={`shrink-0 rounded-full object-cover object-left h-5 w-5 ${className ?? ""}`}
      aria-hidden
    />
  );
}

const SECTIONS = [
  { id: "home", label: "TOP", href: "/dashboard", icon: Home },
  {
    id: "notifications",
    label: "お知らせ",
    href: "/dashboard/notifications",
    icon: Bell,
  },
  { id: "events", label: "イベント情報", href: "/dashboard/events", icon: Calendar },
  { id: "forms", label: "各種フォーム", href: "/dashboard/forms", icon: MessageSquare },
  { id: "chat", label: "フィード", href: "/dashboard/chat", icon: Hash },
  { id: "mk-room", label: "MK ROOM", href: "/dashboard/mk-room", icon: MiyataLogoIcon },
  { id: "archive-videos", label: "アーカイブ動画", href: "/dashboard/archive-videos", icon: Video },
  { id: "usage-guide", label: "ご利用案内", href: "/dashboard/usage-guide", icon: FileText },
] as const;

const PAGES = [
  { id: "member-card", label: "デジタル会員証", href: "/member-card", icon: CreditCard },
  { id: "profile", label: "プロフィール編集", href: "/profile", icon: UserCircle },
] as const;

interface DashboardSidebarProps {
  currentPage?: "dashboard" | "member-card" | "profile" | "archive-videos" | "mk-room" | "usage-guide";
  currentSection?: string;
  /** @deprecated useNewFlags から取得するため未使用。後方互換のため残す */
  newFlags?: { events?: boolean; forms?: boolean; chat?: boolean };
  /** モバイルドロワー用：リンククリック時に閉じるコールバック */
  onLinkClick?: () => void;
}

export function DashboardSidebar({
  currentPage = "dashboard",
  currentSection,
  onLinkClick,
}: DashboardSidebarProps) {
  const newFlags = useNewFlags();
  return (
    <aside className="lg:w-48 shrink-0">
      <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200">ダッシュボード</h1>
      <p className="mt-1 sm:mt-2 text-sm text-slate-600 dark:text-slate-400">メンバー専用サイト</p>
      <nav className="mt-4 lg:mt-6 flex flex-col gap-1">
        {SECTIONS.map(({ id, label, href, icon: Icon }) => {
          const isNew =
            (id === "events" && newFlags.events) ||
            (id === "forms" && newFlags.forms) ||
            (id === "chat" && newFlags.chat);
          return (
            <Link
              key={id}
              href={href}
              onClick={onLinkClick}
              className={`flex items-center justify-between gap-3 rounded-lg px-4 py-3 text-left font-medium transition-colors ${
                (currentPage === "dashboard" && (currentSection || "home") === id) || currentPage === id
                  ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <span className="flex items-center gap-3 min-w-0">
                <Icon className="h-5 w-5 shrink-0" />
                {label}
              </span>
              {isNew && (
                <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded">
                  NEW
                </span>
              )}
            </Link>
          );
        })}
        <div className="my-2 border-t border-slate-200 dark:border-slate-700" />
        {PAGES.map(({ id, label, href, icon: Icon }) => (
          <Link
            key={id}
            href={href}
            onClick={onLinkClick}
            className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left font-medium transition-colors ${
              currentPage === id
                ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
