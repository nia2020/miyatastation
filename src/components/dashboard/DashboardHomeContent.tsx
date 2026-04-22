"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  MessageSquare,
  Hash,
  Video,
  FileText,
  ChevronRight,
} from "lucide-react";
import { useNewFlags } from "@/contexts/NewFlagsContext";

type CardTheme = "amber" | "emerald" | "violet" | "gold" | "rose" | "sky";

const THEME_CLASSES: Record<
  CardTheme,
  {
    cardBg: string;
    iconBg: string;
    iconText: string;
    hoverBorder: string;
    hoverShadow: string;
    iconHover: string;
  }
> = {
  amber: {
    cardBg: "bg-gradient-to-br from-amber-50/80 to-orange-50/60 dark:from-amber-950/30 dark:to-orange-950/20",
    iconBg: "bg-gradient-to-br from-amber-400 to-orange-500",
    iconText: "text-white",
    hoverBorder: "hover:border-amber-400/60 dark:hover:border-amber-500/50",
    hoverShadow: "hover:shadow-lg hover:shadow-amber-500/15 dark:hover:shadow-amber-500/10",
    iconHover: "group-hover:scale-110",
  },
  emerald: {
    cardBg: "bg-gradient-to-br from-emerald-50/80 to-teal-50/60 dark:from-emerald-950/30 dark:to-teal-950/20",
    iconBg: "bg-gradient-to-br from-emerald-400 to-teal-500",
    iconText: "text-white",
    hoverBorder: "hover:border-emerald-400/60 dark:hover:border-emerald-500/50",
    hoverShadow: "hover:shadow-lg hover:shadow-emerald-500/15 dark:hover:shadow-emerald-500/10",
    iconHover: "group-hover:scale-110",
  },
  violet: {
    cardBg: "bg-gradient-to-br from-violet-50/80 to-purple-50/60 dark:from-violet-950/30 dark:to-purple-950/20",
    iconBg: "bg-gradient-to-br from-violet-400 to-purple-500",
    iconText: "text-white",
    hoverBorder: "hover:border-violet-400/60 dark:hover:border-violet-500/50",
    hoverShadow: "hover:shadow-lg hover:shadow-violet-500/15 dark:hover:shadow-violet-500/10",
    iconHover: "group-hover:scale-110",
  },
  gold: {
    cardBg: "bg-gradient-to-br from-amber-50/90 via-yellow-50/70 to-amber-100/80 dark:from-amber-950/40 dark:via-yellow-950/20 dark:to-amber-900/30",
    iconBg: "bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-500",
    iconText: "text-white",
    hoverBorder: "hover:border-amber-400/70 dark:hover:border-amber-400/60",
    hoverShadow: "hover:shadow-lg hover:shadow-amber-400/20 dark:hover:shadow-amber-500/15",
    iconHover: "group-hover:scale-110",
  },
  rose: {
    cardBg: "bg-gradient-to-br from-rose-50/80 to-pink-50/60 dark:from-rose-950/30 dark:to-pink-950/20",
    iconBg: "bg-gradient-to-br from-rose-400 to-pink-500",
    iconText: "text-white",
    hoverBorder: "hover:border-rose-400/60 dark:hover:border-rose-500/50",
    hoverShadow: "hover:shadow-lg hover:shadow-rose-500/15 dark:hover:shadow-rose-500/10",
    iconHover: "group-hover:scale-110",
  },
  sky: {
    cardBg: "bg-gradient-to-br from-sky-50/80 to-blue-50/60 dark:from-sky-950/30 dark:to-blue-950/20",
    iconBg: "bg-gradient-to-br from-sky-400 to-blue-500",
    iconText: "text-white",
    hoverBorder: "hover:border-sky-400/60 dark:hover:border-sky-500/50",
    hoverShadow: "hover:shadow-lg hover:shadow-sky-500/15 dark:hover:shadow-sky-500/10",
    iconHover: "group-hover:scale-110",
  },
};

const HUB_LINKS = [
  {
    key: "events",
    href: "/dashboard/events",
    title: "イベント情報",
    description: "Zoomイベントのスケジュールと入室情報",
    icon: Calendar,
    theme: "amber" as CardTheme,
    newFlag: "events" as const,
  },
  {
    key: "forms",
    href: "/dashboard/forms",
    title: "各種フォーム",
    description: "テーマ・メッセージの募集とGoogleフォームへのリンク",
    icon: MessageSquare,
    theme: "emerald" as CardTheme,
    newFlag: null,
  },
  {
    key: "chat",
    href: "/dashboard/chat",
    title: "フィード",
    description: "コミュニティの投稿を確認",
    icon: Hash,
    theme: "violet" as CardTheme,
    newFlag: "chat" as const,
  },
  {
    key: "mk-room",
    href: "/dashboard/mk-room",
    title: "MK ROOM",
    description: "宮田 和弥 秘密の部屋",
    icon: null,
    theme: "gold" as CardTheme,
    newFlag: null,
  },
] as const;

interface DashboardHomeContentProps {
  displayName: string;
  announcement: string;
  avatarUrl?: string | null;
}

export function DashboardHomeContent({
  displayName,
  announcement,
  avatarUrl,
}: DashboardHomeContentProps) {
  const newFlags = useNewFlags();

  return (
    <div className="space-y-8 min-w-0 overflow-visible">
      {announcement && (
        <div className="rounded-xl border-2 border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/50 p-5">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-2">
            {"\ud83d\udce2 \u904b\u55b6\u304b\u3089\u306e\u304a\u77e5\u3089\u305b"}
          </p>
          <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
            {announcement}
          </p>
        </div>
      )}
      <div className="flex items-center gap-6">
        <div className="shrink-0 w-24 h-24 overflow-hidden flex items-center justify-center bg-transparent">
          {avatarUrl ? (
            <div className="w-full h-full rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
              <Image
                src={avatarUrl}
                alt=""
                width={96}
                height={96}
                className="h-24 w-24 object-cover"
              />
            </div>
          ) : (
            <Image
              src="/mascot.png"
              alt="Miyata Station マスコット"
              width={96}
              height={96}
              className="h-24 w-24 object-contain"
            />
          )}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
            TOP
          </h2>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            ようこそ、{displayName}さん
          </p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 overflow-visible">
        {HUB_LINKS.map((link) => {
          const { key, href, title, description, icon: Icon, theme, newFlag } = link;
          const t = THEME_CLASSES[theme];
          const useLogoIcon = href === "/dashboard/mk-room";
          const isNew =
            key === "forms"
              ? newFlags.messageCollection || newFlags.googleForms
              : newFlag
                ? newFlags[newFlag]
                : false;
          return (
            <Link
              key={key}
              href={href}
              className={`group relative z-0 flex gap-4 rounded-xl border border-slate-200 dark:border-slate-600 p-6 transition-all duration-300 hover:scale-[1.02] hover:z-10 ${t.cardBg} ${t.hoverBorder} ${t.hoverShadow}`}
            >
              {isNew && (
                <span className="absolute top-3 right-3 px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded">
                  NEW
                </span>
              )}
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg overflow-hidden transition-transform duration-300 ${t.iconBg} ${t.iconText} ${t.iconHover}`}>
                {useLogoIcon ? (
                  <Image
                    src="/logo.png"
                    alt=""
                    width={96}
                    height={96}
                    quality={90}
                    className="h-8 w-8 rounded-full object-cover object-left"
                  />
                ) : (
                  Icon && <Icon className="h-6 w-6" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                  {title}
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  {description}
                </p>
              </div>
            </Link>
          );
        })}
        <div className="sm:col-span-2 lg:col-span-2 flex flex-col sm:flex-row gap-4">
          <Link
            href="/dashboard/archive-videos"
            className={`group relative z-0 flex gap-4 rounded-xl border border-slate-200 dark:border-slate-600 p-6 transition-all duration-300 hover:scale-[1.02] hover:z-10 min-w-0 flex-1 ${THEME_CLASSES.rose.cardBg} ${THEME_CLASSES.rose.hoverBorder} ${THEME_CLASSES.rose.hoverShadow}`}
          >
            {newFlags.archiveVideos ? (
              <span className="absolute top-3 right-3 px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded">
                NEW
              </span>
            ) : null}
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg overflow-hidden transition-transform duration-300 ${THEME_CLASSES.rose.iconBg} ${THEME_CLASSES.rose.iconText} ${THEME_CLASSES.rose.iconHover}`}>
              <Video className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                アーカイブ動画
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                {"\u671f\u9593\u9650\u5b9a\u3067\u516c\u958b\u4e2d\u306e\u52d5\u753b\u3092\u8996\u8074"}
              </p>
            </div>
          </Link>
          <Link
            href="/dashboard/usage-guide"
            className={`group relative z-0 flex gap-4 rounded-xl border border-slate-200 dark:border-slate-600 p-5 min-w-0 flex-1 transition-all duration-300 hover:scale-[1.02] hover:z-10 ${THEME_CLASSES.sky.cardBg} ${THEME_CLASSES.sky.hoverBorder} ${THEME_CLASSES.sky.hoverShadow}`}
          >
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg overflow-hidden transition-transform duration-300 ${THEME_CLASSES.sky.iconBg} ${THEME_CLASSES.sky.iconText} ${THEME_CLASSES.sky.iconHover}`}>
              <FileText className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1">
                ご利用案内
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-sky-500 transition-colors" />
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {"\u30e1\u30f3\u30d0\u30fc\u30b5\u30a4\u30c8\u306e\u3054\u5229\u7528\u306b\u95a2\u3059\u308b\u6848\u5185\u3092\u78ba\u8a8d"}
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
