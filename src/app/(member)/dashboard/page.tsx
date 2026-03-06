import Image from "next/image";
import Link from "next/link";
import { Calendar, MessageSquare, Hash, CreditCard, UserCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

const HUB_LINKS = [
  {
    href: "/dashboard/events",
    title: "イベント情報",
    description: "Zoomイベントのスケジュールと入室情報",
    icon: Calendar,
  },
  {
    href: "/dashboard/forms",
    title: "メッセージ募集",
    description: "Googleフォームでメッセージを送信",
    icon: MessageSquare,
  },
  {
    href: "/dashboard/chat",
    title: "タイムライン",
    description: "コミュニティの投稿を確認",
    icon: Hash,
  },
  {
    href: "/member-card",
    title: "デジタル会員証",
    description: "会員証を表示",
    icon: CreditCard,
  },
  {
    href: "/profile",
    title: "プロフィール編集",
    description: "ニックネーム等を編集",
    icon: UserCircle,
  },
] as const;

export const dynamic = "force-dynamic";

export default async function DashboardHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  let newFlags = { events: false, forms: false, chat: false };
  try {
    const [contentUpdates, userViews] = await Promise.all([
      Promise.all([
        supabase.from("events").select("updated_at").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("site_config").select("updated_at").eq("key", "message_collection_forms").maybeSingle(),
        supabase.from("admin_posts").select("created_at").order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]),
      supabase.from("user_section_views").select("section, last_viewed_at").eq("user_id", user.id),
    ]);
    const lastViewedMap = Object.fromEntries(
      (userViews.data ?? []).map((r) => [r.section, r.last_viewed_at])
    );
    const eventsLastUpdate = contentUpdates[0].data?.updated_at;
    const formsLastUpdate = contentUpdates[1].data?.updated_at;
    const chatLastUpdate = contentUpdates[2].data?.created_at;
    newFlags = {
      events: !!eventsLastUpdate && new Date(eventsLastUpdate) > new Date(lastViewedMap.events ?? 0),
      forms: !!formsLastUpdate && new Date(formsLastUpdate) > new Date(lastViewedMap.forms ?? 0),
      chat: !!chatLastUpdate && new Date(chatLastUpdate) > new Date(lastViewedMap.chat ?? 0),
    };
  } catch {
    // user_section_views テーブルが無い場合など
  }

  const { data: announcementRow } = await supabase
    .from("site_config")
    .select("value")
    .eq("key", "announcement")
    .maybeSingle();
  const announcement = announcementRow?.value?.trim() ?? "";

  return (
    <div className="space-y-8">
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
          <div className="shrink-0 w-24 h-24">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/mascot.png"
              alt="Miyata Station マスコット"
              width={96}
              height={96}
              className="h-24 w-24 object-contain block bg-transparent"
              style={{ background: "transparent" }}
            />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
              会員TOP
            </h2>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              ようこそ、{profile?.nickname?.trim() || profile?.full_name || "会員"}さん
            </p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {HUB_LINKS.map(({ href, title, description, icon: Icon }) => {
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
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
                  <Icon className="h-6 w-6" />
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
        </div>
        <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-600 flex flex-wrap gap-8 items-start">
          <div className="w-72 shrink-0">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Online Community Miyata Station
            </p>
            <a
              href="https://sunhouse-miyata-kazuya.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="block hover:opacity-80 transition-opacity"
            >
              <Image
                src="/banner-sunhouse.png"
                alt="宮田和弥 Online Community Miyata Station"
                width={288}
                height={48}
                className="w-full h-14 object-contain object-left invert"
              />
            </a>
          </div>
          <div className="w-72 shrink-0">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              MIYATA KAZUYA Official Site
            </p>
            <a
              href="https://www.miyata-kazuya.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="block hover:opacity-80 transition-opacity"
            >
              <Image
                src="/banner-miyata.png"
                alt="宮田和弥 オフィシャルサイト"
                width={288}
                height={48}
                className="w-full h-14 object-contain object-left invert"
              />
            </a>
          </div>
          <div className="w-72 shrink-0">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              JUN SKY WALKER(S) Official Site
            </p>
            <a
              href="http://junskywalkers.jp/"
              target="_blank"
              rel="noopener noreferrer"
              className="block hover:opacity-80 transition-opacity"
            >
              <Image
                src="/banner-junskywalkers.png"
                alt="JUN SKY WALKER(S) オフィシャルサイト"
                width={288}
                height={48}
                className="w-full h-14 object-contain object-left invert"
              />
            </a>
          </div>
        </div>
      </div>
  );
}
