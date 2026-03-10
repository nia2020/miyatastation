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

const HUB_LINKS = [
  { href: "/dashboard/events", title: "イベント情報", description: "Zoomイベントのスケジュールと入室情報", icon: Calendar },
  { href: "/dashboard/forms", title: "メッセージ募集", description: "Googleフォームでメッセージを送信", icon: MessageSquare },
  { href: "/dashboard/chat", title: "フィード", description: "コミュニティの投稿を確認", icon: Hash },
  { href: "/dashboard/mk-room", title: "MK ROOM", description: "宮田 和弥 秘密の部屋", icon: null },
  { href: "/dashboard/archive-videos", title: "アーカイブ動画", description: "期間限定で公開中の動画を視聴", icon: Video },
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
    <div className="space-y-8 min-w-0 overflow-hidden">
      {announcement && (
        <div className="rounded-xl border-2 border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/50 p-5">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-2">
            📢 運営からのお知らせ
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
            会員TOP
          </h2>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            ようこそ、{displayName}さん
          </p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {HUB_LINKS.slice(0, 4).map((link) => {
          const { href, title, description, icon: Icon } = link;
          const useLogoIcon = href === "/dashboard/mk-room";
          const isNew =
            (href.includes("/events") && newFlags.events) ||
            (href.includes("/forms") && newFlags.forms) ||
            (href.includes("/chat") && newFlags.chat);
          return (
            <Link
              key={href}
              href={href}
              className="relative flex gap-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-6 transition-all hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md"
            >
              {isNew && (
                <span className="absolute top-3 right-3 px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded">
                  NEW
                </span>
              )}
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 overflow-hidden">
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
            className="relative flex gap-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-6 transition-all hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md min-w-0 flex-1"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 overflow-hidden">
              <Video className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                アーカイブ動画
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                期間限定で公開中の動画を視聴
              </p>
            </div>
          </Link>
          <Link
            href="/dashboard/usage-guide"
            className="flex gap-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-5 min-w-0 flex-1 transition-all hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md group"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 overflow-hidden">
              <FileText className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1">
                ご利用案内
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                会員サイトのご利用に関する案内を確認
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
