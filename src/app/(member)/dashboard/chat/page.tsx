import { createClient } from "@/lib/supabase/server";
import { ChatPost } from "@/components/chat/ChatPost";
import { ChatPostForm } from "@/components/chat/ChatPostForm";

export const dynamic = "force-dynamic";

export default async function DashboardChatPage() {
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

  const now = new Date().toISOString();
  const isAdminOrPoster =
    profile?.role === "admin" || profile?.role === "poster";

  const { data: publishedPosts } = await supabase
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
        profiles(nickname, avatar_url)
      ),
      likes:post_likes(id, user_id)
    `
    )
    .eq("channel", "feed")
    .or(`published_at.is.null,published_at.lte.${now}`)
    .order("created_at", { ascending: false });

  const { data: scheduledPosts } =
    isAdminOrPoster
      ? await supabase
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
              profiles(nickname, avatar_url)
            ),
            likes:post_likes(id, user_id)
          `
          )
          .eq("channel", "feed")
          .not("published_at", "is", null)
          .gt("published_at", now)
          .order("published_at", { ascending: true })
      : { data: [] };

  const posts = publishedPosts ?? [];
  const allPostIds = [
    ...posts.map((p) => p.author_id),
    ...(scheduledPosts ?? []).map((p) => p.author_id),
  ];
  const authorIds = Array.from(new Set(allPostIds));
  const { data: authorProfiles } =
    authorIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, nickname, full_name, avatar_url")
          .in("id", authorIds)
      : { data: [] };
  const authorMap = Object.fromEntries(
    authorProfiles?.map((p) => [
      p.id,
      (p.nickname?.trim() || p.full_name) ?? "管理者",
    ]) ?? []
  );
  const authorAvatarMap = Object.fromEntries(
    authorProfiles?.map((p) => [p.id, p.avatar_url]) ?? []
  );
  const commentsOrdered =
    posts.map((p) => ({
      ...p,
      comments:
        (p.comments as Array<{
          id: string;
          post_id: string;
          user_id: string;
          content: string;
          created_at: string;
          profiles: { nickname: string | null; avatar_url: string | null } | null;
        }>)?.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ) ?? [],
      likes: (p.likes as Array<{ id: string; user_id: string }>) ?? [],
    }));

  const scheduledOrdered =
    (scheduledPosts ?? []).map((p) => ({
      ...p,
      comments:
        (p.comments as Array<{
          id: string;
          post_id: string;
          user_id: string;
          content: string;
          created_at: string;
          profiles: { nickname: string | null; avatar_url: string | null } | null;
        }>)?.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ) ?? [],
      likes: (p.likes as Array<{ id: string; user_id: string }>) ?? [],
    }));

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
        フィード
      </h2>
      {(profile?.role === "admin" || profile?.role === "poster") && (
        <ChatPostForm
          channel="feed"
          currentUserNickname={
            profile?.nickname?.trim() || profile?.full_name || "管理者"
          }
          currentUserAvatarUrl={profile?.avatar_url ?? null}
        />
      )}
      {scheduledOrdered.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-amber-700 dark:text-amber-400">
            予約投稿 ({scheduledOrdered.length})
          </h3>
          <div className="space-y-4">
            {scheduledOrdered.map((post) => (
              <ChatPost
                key={post.id}
                post={post}
                authorName={authorMap[post.author_id]}
                authorAvatarUrl={authorAvatarMap[post.author_id] ?? null}
                currentUserNickname={
                  profile?.nickname?.trim() || profile?.full_name || "メンバー"
                }
                currentUserAvatarUrl={profile?.avatar_url ?? null}
                currentUserId={user.id}
                isAdmin={profile?.role === "admin"}
                isPoster={profile?.role === "poster"}
                isScheduled
              />
            ))}
          </div>
        </div>
      )}
      {commentsOrdered.length > 0 ? (
        <div className="space-y-6">
          {scheduledOrdered.length > 0 && (
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
              公開中の投稿
            </h3>
          )}
          {commentsOrdered.map((post) => (
            <ChatPost
              key={post.id}
              post={post}
              authorName={authorMap[post.author_id]}
              authorAvatarUrl={authorAvatarMap[post.author_id] ?? null}
              currentUserNickname={
                profile?.nickname?.trim() || profile?.full_name || "メンバー"
              }
              currentUserAvatarUrl={profile?.avatar_url ?? null}
              currentUserId={user.id}
              isAdmin={profile?.role === "admin"}
              isPoster={profile?.role === "poster"}
            />
          ))}
        </div>
      ) : scheduledOrdered.length === 0 ? (
        <div className="p-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 text-center text-slate-600 dark:text-slate-400">
          まだ投稿はありません
        </div>
      ) : null}
    </div>
  );
}
