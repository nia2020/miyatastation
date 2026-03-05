import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EventCard } from "@/components/events/EventCard";
import { GoogleFormLink } from "@/components/forms/GoogleFormLink";
import { ChatPost } from "@/components/chat/ChatPost";
import { ChatPostForm } from "@/components/chat/ChatPostForm";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";

const SECTIONS = [
  { id: "events", label: "イベント情報" },
  { id: "forms", label: "メッセージ募集" },
  { id: "chat", label: "タイムライン" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { section?: string };
}) {
  const section = (searchParams?.section as SectionId) || "events";
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

  const { data: upcomingEvents } = await supabase
    .from("events")
    .select("*")
    .gte("event_date", new Date().toISOString())
    .order("event_date", { ascending: true });

  const { data: pastEvents } = await supabase
    .from("events")
    .select("*")
    .lt("event_date", new Date().toISOString())
    .order("event_date", { ascending: false })
    .limit(5);

  const { data: configRows } = await supabase
    .from("site_config")
    .select("key, value")
    .in("key", [
      "message_collection_forms",
      "google_form_url",
      "message_collection_title",
    ]);

  const configMap = configRows?.reduce(
    (acc, r) => {
      acc[r.key] = r.value;
      return acc;
    },
    {} as Record<string, string | null>
  );

  let messageForms: { title: string; url: string; description?: string }[] = [];
  try {
    const parsed = configMap?.message_collection_forms?.trim();
    if (parsed) {
      const arr = JSON.parse(parsed) as unknown;
      if (Array.isArray(arr)) {
        messageForms = arr
          .filter(
            (f): f is { title: string; url: string; description?: string } =>
              f &&
              typeof f === "object" &&
              typeof (f as { title: string; url: string }).title === "string" &&
              typeof (f as { title: string; url: string }).url === "string"
          )
          .map((f) => ({
            title: (f as { title: string; url: string; description?: string }).title,
            url: (f as { title: string; url: string }).url,
            description: typeof (f as { description?: string }).description === "string" ? (f as { description: string }).description : "",
          }));
      }
    }
  } catch {}
  if (messageForms.length === 0 && configMap?.google_form_url?.trim()) {
    messageForms = [
      {
        title: configMap?.message_collection_title?.trim() || "メッセージ募集",
        url: configMap.google_form_url,
        description: "",
      },
    ];
  }

  const { data: posts } = await supabase
    .from("admin_posts")
    .select(
      `
      *,
      comments:post_comments(
        id,
        post_id,
        user_id,
        content,
        created_at,
        profiles(full_name)
      )
    `
    )
    .order("created_at", { ascending: false });

  const authorIds = [...new Set(posts?.map((p) => p.author_id) ?? [])];
  const { data: authorProfiles } =
    authorIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", authorIds)
      : { data: [] };
  const authorMap = Object.fromEntries(
    authorProfiles?.map((p) => [p.id, p.full_name]) ?? []
  );

  const commentsOrdered =
    posts?.map((p) => ({
      ...p,
      comments:
        (p.comments as Array<{
          id: string;
          post_id: string;
          user_id: string;
          content: string;
          created_at: string;
          profiles: { full_name: string } | null;
        }>)?.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ) ?? [],
    })) ?? [];

  return (
    <div className="flex gap-8">
      <DashboardSidebar currentPage="dashboard" currentSection={section} />

      {/* 右: コンテンツ */}
      <main className="min-w-0 flex-1">
        {section === "events" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
              イベント情報
            </h2>
            {upcomingEvents && upcomingEvents.length > 0 ? (
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <div className="p-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 text-center text-slate-600 dark:text-slate-400">
                現在予定されているイベントはありません
              </div>
            )}
            {pastEvents && pastEvents.length > 0 && (
              <>
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-8">
                  過去のイベント
                </h2>
                <div className="space-y-4">
                  {pastEvents.map((event) => (
                    <EventCard key={event.id} event={event} isPast />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {section === "forms" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
              メッセージ募集
            </h2>
            <GoogleFormLink forms={messageForms} />
          </div>
        )}

        {section === "chat" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
              タイムライン
            </h2>
            {(profile?.role === "admin" || profile?.role === "poster") && (
              <ChatPostForm />
            )}
            {commentsOrdered.length > 0 ? (
              <div className="space-y-6">
                {commentsOrdered.map((post) => (
                  <ChatPost
                    key={post.id}
                    post={post}
                    authorName={authorMap[post.author_id]}
                    currentUserFullName={profile?.full_name}
                    currentUserId={user.id}
                    isAdmin={profile?.role === "admin"}
                    isPoster={profile?.role === "poster"}
                  />
                ))}
              </div>
            ) : (
              <div className="p-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 text-center text-slate-600 dark:text-slate-400">
                まだ投稿はありません
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
