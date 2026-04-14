"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MessageCircle, Hash, Calendar, FileText } from "lucide-react";
import { useNewFlags } from "@/contexts/NewFlagsContext";
import type { UserNotification } from "@/types/database";

function dayBucketJST(iso: string): "today" | "yesterday" | "older" {
  const d = new Date(iso);
  const key = (x: Date) =>
    x.toLocaleDateString("ja-JP", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  const todayKey = key(new Date());
  const y = new Date();
  y.setDate(y.getDate() - 1);
  const yesterdayKey = key(y);
  const k = key(d);
  if (k === todayKey) return "today";
  if (k === yesterdayKey) return "yesterday";
  return "older";
}

function relativeTimeJa(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const diffMs = now - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "たった今";
  if (mins < 60) return `${mins}分前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}日前`;
  return d.toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const BUCKET_LABEL: Record<string, string> = {
  today: "今日",
  yesterday: "昨日",
  older: "以前",
};

export function NotificationsPageClient() {
  const router = useRouter();
  const newFlags = useNewFlags();
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [items, setItems] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error("読み込みに失敗しました");
      const data = await res.json();
      setItems(data.notifications ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラー");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(
    () =>
      tab === "unread"
        ? items.filter((n) => !n.read_at)
        : items,
    [items, tab]
  );

  const grouped = useMemo(() => {
    const order: Array<"today" | "yesterday" | "older"> = [
      "today",
      "yesterday",
      "older",
    ];
    const map = new Map<string, UserNotification[]>();
    for (const k of order) map.set(k, []);
    for (const n of filtered) {
      const b = dayBucketJST(n.created_at);
      map.get(b)!.push(n);
    }
    return order.map((k) => ({ key: k, label: BUCKET_LABEL[k], list: map.get(k)! }));
  }, [filtered]);

  const markReadAndGo = async (n: UserNotification) => {
    if (!n.read_at) {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: n.id }),
      });
      setItems((prev) =>
        prev.map((x) =>
          x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x
        )
      );
    }
    router.push(n.link_path);
  };

  const markAllRead = async () => {
    await fetch("/api/notifications/mark-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    await load();
  };

  const unreadCount = items.filter((n) => !n.read_at).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
          お知らせ
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 dark:border-slate-600 p-0.5 bg-slate-50 dark:bg-slate-800/80">
            <button
              type="button"
              onClick={() => setTab("all")}
              className={`px-3 py-1.5 text-sm rounded-md ${
                tab === "all"
                  ? "bg-white dark:bg-slate-700 shadow-sm font-medium text-slate-800 dark:text-slate-100"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              すべて
            </button>
            <button
              type="button"
              onClick={() => setTab("unread")}
              className={`px-3 py-1.5 text-sm rounded-md ${
                tab === "unread"
                  ? "bg-white dark:bg-slate-700 shadow-sm font-medium text-slate-800 dark:text-slate-100"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              未読
              {unreadCount > 0 ? (
                <span className="ml-1 text-indigo-600 dark:text-indigo-400">
                  ({unreadCount})
                </span>
              ) : null}
            </button>
          </div>
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={() => void markAllRead()}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              すべて既読
            </button>
          ) : null}
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">
          サイトの更新
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link
            href="/dashboard/events"
            className="flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 text-sm text-slate-700 dark:text-slate-200"
          >
            <span className="flex items-center gap-2 min-w-0">
              <Calendar className="h-4 w-4 shrink-0 text-amber-600" />
              イベント情報
            </span>
            {newFlags.events ? (
              <span className="shrink-0 text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded">
                NEW
              </span>
            ) : null}
          </Link>
          <Link
            href="/dashboard/forms"
            className="flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 text-sm text-slate-700 dark:text-slate-200"
          >
            <span className="flex items-center gap-2 min-w-0">
              <FileText className="h-4 w-4 shrink-0 text-emerald-600" />
              各種フォーム
            </span>
            {newFlags.forms ? (
              <span className="shrink-0 text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded">
                NEW
              </span>
            ) : null}
          </Link>
          <Link
            href="/dashboard/chat"
            className="flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 text-sm text-slate-700 dark:text-slate-200"
          >
            <span className="flex items-center gap-2 min-w-0">
              <Hash className="h-4 w-4 shrink-0 text-violet-600" />
              フィード（新しい投稿）
            </span>
            {newFlags.chat ? (
              <span className="shrink-0 text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded">
                NEW
              </span>
            ) : null}
          </Link>
        </div>
      </section>

      {loading ? (
        <p className="text-sm text-slate-500">読み込み中…</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-600 p-10 text-center text-slate-500 dark:text-slate-400 text-sm">
          {tab === "unread"
            ? "未読のお知らせはありません"
            : "まだお知らせはありません。投稿にコメントがあるとここに表示されます。"}
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(
            ({ key, label, list }) =>
              list.length > 0 && (
                <div key={key}>
                  <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">
                    {label}
                  </h2>
                  <ul className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700 overflow-hidden shadow-sm">
                    {list.map((n) => (
                      <li key={n.id}>
                        <button
                          type="button"
                          onClick={() => void markReadAndGo(n)}
                          className="w-full text-left flex gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors"
                        >
                          <div className="relative shrink-0 w-12 h-12">
                            {n.actor_avatar_url ? (
                              <Image
                                src={n.actor_avatar_url}
                                alt=""
                                width={48}
                                height={48}
                                className="rounded-full object-cover w-12 h-12 bg-slate-200"
                              />
                            ) : (
                              <Image
                                src="/mascot.png"
                                alt=""
                                width={48}
                                height={48}
                                className="rounded-full object-contain w-12 h-12 bg-slate-100 dark:bg-slate-700"
                              />
                            )}
                            <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white ring-2 ring-white dark:ring-slate-800">
                              <MessageCircle className="h-3 w-3" aria-hidden />
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-800 dark:text-slate-100 leading-snug">
                              <span className="font-semibold">
                                {n.actor_display_name}
                              </span>
                              さんがあなたの投稿にコメントしました
                            </p>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                              「{n.post_title}」
                            </p>
                            {n.comment_preview ? (
                              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                                {n.comment_preview}
                              </p>
                            ) : null}
                            <p className="mt-2 text-xs text-indigo-600 dark:text-indigo-400">
                              {relativeTimeJa(n.created_at)}
                            </p>
                          </div>
                          {!n.read_at ? (
                            <span
                              className="shrink-0 mt-1 h-2.5 w-2.5 rounded-full bg-blue-500"
                              aria-label="未読"
                            />
                          ) : (
                            <span className="shrink-0 w-2.5" />
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )
          )}
        </div>
      )}
    </div>
  );
}
